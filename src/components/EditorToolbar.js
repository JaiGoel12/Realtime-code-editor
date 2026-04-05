import React, { useState } from 'react';
import toast from 'react-hot-toast';
import LanguageSelector from './LanguageSelector';

const EditorToolbar = ({
    currentLanguage,
    onLanguageChange,
    socketRef,
    roomId,
    code,
    onFontSizeChange,
    fontSize,
    onClearCode,
    onFormatCode,
}) => {
    const [showStats, setShowStats] = useState(false);

    const copyCode = () => {
        if (!code || code.trim() === '') {
            toast.error('No code to copy');
            return;
        }
        navigator.clipboard.writeText(code);
        toast.success('Code copied to clipboard!');
    };

    const downloadCode = () => {
        if (!code || code.trim() === '') {
            toast.error('No code to download');
            return;
        }

        const extension = getFileExtension(currentLanguage);
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Code downloaded!');
    };

    const getFileExtension = (lang) => {
        const extensions = {
            javascript: 'js',
            python: 'py',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            html: 'html',
            css: 'css',
            xml: 'xml',
            json: 'json',
            sql: 'sql',
            php: 'php',
            ruby: 'rb',
            go: 'go',
            rust: 'rs',
            swift: 'swift',
            typescript: 'ts',
        };
        return extensions[lang] || 'txt';
    };

    const getCodeStats = () => {
        if (!code) return { lines: 0, characters: 0, words: 0 };
        const lines = code.split('\n').length;
        const characters = code.length;
        const words = code.trim() === '' ? 0 : code.trim().split(/\s+/).length;
        return { lines, characters, words };
    };

    const stats = getCodeStats();
    const roomPreview =
        roomId && roomId.length > 12 ? `${roomId.slice(0, 10)}…` : roomId || '—';

    return (
        <div className="cs-toolbar-shell">
            <div className="cs-toolbar">
                <div className="cs-toolbar-left">
                    <div
                        className="cs-toolbar-cluster cs-toolbar-cluster--room"
                        title={roomId || undefined}
                    >
                        <span className="cs-toolbar-room-dot" aria-hidden />
                        <span className="cs-toolbar-room-meta">
                            <span className="cs-toolbar-room-label">Room</span>
                            <code className="cs-toolbar-room-id">{roomPreview}</code>
                        </span>
                    </div>

                    <div className="cs-toolbar-cluster">
                        <LanguageSelector
                            currentLanguage={currentLanguage}
                            onLanguageChange={onLanguageChange}
                            socketRef={socketRef}
                            roomId={roomId}
                        />

                        <div className="cs-lang-field">
                            <label htmlFor="font-size-select">Font</label>
                            <select
                                id="font-size-select"
                                className="cs-select"
                                value={fontSize}
                                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                            >
                                <option value={12}>12px</option>
                                <option value={14}>14px</option>
                                <option value={16}>16px</option>
                                <option value={18}>18px</option>
                                <option value={20}>20px</option>
                                <option value={22}>22px</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="cs-toolbar-right cs-toolbar-cluster">
                    <button
                        type="button"
                        className={
                            'cs-toolbar-btn' +
                            (showStats ? ' cs-toolbar-btn--active' : '')
                        }
                        onClick={() => setShowStats(!showStats)}
                        title="Toggle statistics"
                    >
                        Stats
                    </button>

                    <button
                        type="button"
                        className="cs-toolbar-btn"
                        onClick={onFormatCode}
                        title="Format code"
                    >
                        Format
                    </button>

                    <button
                        type="button"
                        className="cs-toolbar-btn"
                        onClick={copyCode}
                        title="Copy code"
                    >
                        Copy
                    </button>

                    <button
                        type="button"
                        className="cs-toolbar-btn"
                        onClick={downloadCode}
                        title="Download file"
                    >
                        Download
                    </button>

                    <button
                        type="button"
                        className="cs-toolbar-btn cs-toolbar-btn--danger"
                        onClick={onClearCode}
                        title="Clear all code"
                    >
                        Clear
                    </button>
                </div>

                {showStats && (
                    <div className="cs-stats-pop">
                        <h4>By the numbers</h4>
                        <div>
                            <div>
                                Lines: <strong>{stats.lines}</strong>
                            </div>
                            <div>
                                Chars: <strong>{stats.characters}</strong>
                            </div>
                            <div>
                                Words: <strong>{stats.words}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorToolbar;
