import React, { useState, useEffect } from 'react';

const ConnectionStatus = ({ socketRef }) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socketRef.current) return;

        const updateStatus = () => {
            setIsConnected(socketRef.current?.connected || false);
        };

        updateStatus();

        socketRef.current.on('connect', updateStatus);
        socketRef.current.on('disconnect', updateStatus);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect', updateStatus);
                socketRef.current.off('disconnect', updateStatus);
            }
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

