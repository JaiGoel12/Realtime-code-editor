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
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: isConnected ? 'rgba(74, 237, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
            border: `1px solid ${isConnected ? '#4aed88' : '#ff6b6b'}`,
            fontSize: '12px',
            fontWeight: '500'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#4aed88' : '#ff6b6b',
                boxShadow: isConnected ? '0 0 8px #4aed88' : 'none',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{ color: isConnected ? '#4aed88' : '#ff6b6b' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
            </span>
        </div>
    );
};

export default ConnectionStatus;

