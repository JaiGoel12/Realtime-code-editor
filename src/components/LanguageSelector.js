import React from 'react';
import { LANGUAGES } from '../utils/languages';
import ACTIONS from '../Actions';

const LanguageSelector = ({ currentLanguage, onLanguageChange, socketRef, roomId }) => {
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        onLanguageChange(newLanguage);
        
        // Broadcast language change to other users
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
                roomId,
                newLanguage,
            });
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px'
        }}>
            <label htmlFor="language-select" style={{ 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#fff'
            }}>
                Language:
            </label>
            <select
                id="language-select"
                value={currentLanguage}
                onChange={handleLanguageChange}
                style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#282a36',
                    color: '#f8f8f2',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '150px'
                }}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;

