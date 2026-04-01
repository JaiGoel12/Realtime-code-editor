import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, isTyping }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%'
        }}>
            <Avatar 
                name={username} 
                size={36} 
                round="8px"
                style={{ border: isTyping ? '2px solid #7fffbe' : '2px solid #4aed88', boxShadow: isTyping ? '0 0 10px rgba(74, 237, 136, 0.6)' : 'none' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                    fontSize: '13px',
                    color: '#f8f8f2',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                }}>
                    {username}
                </span>
                {isTyping && (
                    <span style={{
                        fontSize: '11px',
                        color: '#4aed88',
                        fontWeight: '600',
                        letterSpacing: '0.02em'
                    }}>
                        Typing…
                    </span>
                )}
            </div>
        </div>
    );
};

export default Client;
