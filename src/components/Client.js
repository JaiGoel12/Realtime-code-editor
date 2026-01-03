import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username }) => {
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
                style={{ border: '2px solid #4aed88' }}
            />
            <span style={{
                fontSize: '13px',
                color: '#f8f8f2',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
            }}>
                {username}
            </span>
        </div>
    );
};

export default Client;
