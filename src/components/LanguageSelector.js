import React from 'react';
import { LANGUAGES } from '../utils/languages';
import ACTIONS from '../Actions';

const LanguageSelector = ({ currentLanguage, onLanguageChange, socketRef, roomId }) => {
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        onLanguageChange(newLanguage);

        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
                roomId,
                newLanguage,
            });
        }
    };

    return (
        <div className="cs-lang-field">
            <label htmlFor="language-select">Language</label>
            <select
                id="language-select"
                className="cs-select cs-select--lang"
                value={currentLanguage}
                onChange={handleLanguageChange}
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
