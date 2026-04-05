import React, { useState, useEffect } from 'react';

const ConnectionStatus = ({ socketRef }) => {
    const [isConnected, setIsConnected] = useState(true); // Default to true, will update when socket is ready

    useEffect(() => {
        let intervalId;
        let attachedSocket = null;

        const detach = () => {
            if (attachedSocket) {
                attachedSocket.off('connect', updateStatus);
                attachedSocket.off('disconnect', updateStatus);
                attachedSocket = null;
            }
        };

        const updateStatus = () => {
            setIsConnected(attachedSocket?.connected || false);
        };

        const attach = (socket) => {
            detach();
            attachedSocket = socket;
            updateStatus();
            socket.on('connect', updateStatus);
            socket.on('disconnect', updateStatus);
        };

        const tryAttach = () => {
            const s = socketRef.current;
            if (s) {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = undefined;
                }
                attach(s);
            }
        };

        tryAttach();
        if (!socketRef.current) {
            intervalId = setInterval(tryAttach, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            detach();
        };
    }, [socketRef]);

    return (
        <div
            className={
                'cs-conn ' +
                (isConnected ? 'cs-conn--ok' : 'cs-conn--bad')
            }
        >
            <span className="cs-conn-dot" aria-hidden />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
    );
};

export default ConnectionStatus;

