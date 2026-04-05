import { useState, useEffect } from 'react';

/** Tracks `html[data-theme]` so embedded Clerk (and similar) can react to the theme toggle. */
export function useCodeSyncTheme() {
    const [mode, setMode] = useState(() =>
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('data-theme') === 'light'
            ? 'light'
            : 'dark'
    );

    useEffect(() => {
        const el = document.documentElement;
        const sync = () => {
            setMode(
                el.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
            );
        };
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
        return () => mo.disconnect();
    }, []);

    return mode;
}
