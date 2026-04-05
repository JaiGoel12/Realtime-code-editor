import React, { useState, useCallback } from 'react';
import { getTheme, setTheme } from '../utils/theme';

/**
 * Cycles dark ↔ light. Persists to localStorage and sets `data-theme` on `html`.
 */
function ThemeToggle({ className = '' }) {
    const [mode, setMode] = useState(getTheme);

    const onClick = useCallback(() => {
        const next = mode === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setMode(next);
    }, [mode]);

    const isDark = mode === 'dark';

    return (
        <button
            type="button"
            className={`cs-theme-toggle ${className}`.trim()}
            onClick={onClick}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? (
                <svg
                    className="cs-theme-toggle-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    aria-hidden
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
            ) : (
                <svg
                    className="cs-theme-toggle-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}

export default ThemeToggle;
