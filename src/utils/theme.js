const STORAGE_KEY = 'codesync-theme';

/** @returns {'dark' | 'light'} */
export function getTheme() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'light'
            ? 'light'
            : 'dark';
    } catch {
        return 'dark';
    }
}

/** @param {'dark' | 'light'} theme */
export function setTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    try {
        window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
        /* ignore */
    }
    applyTheme(t);
}

/** @param {'dark' | 'light'} theme */
export function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', t === 'light' ? '#e8edf5' : '#030508');
    }
}
