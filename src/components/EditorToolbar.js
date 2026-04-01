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
    onFormatCode
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

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
            borderBottom: '2px solid #3a3a5c',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <LanguageSelector
                    currentLanguage={currentLanguage}
                    onLanguageChange={onLanguageChange}
                    socketRef={socketRef}
                    roomId={roomId}
                />
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', color: '#a0a0a0', fontWeight: '500' }}>
                        Font:
                    </label>
                    <select
                        value={fontSize}
                        onChange={(e) => onFontSizeChange(Number(e.target.value))}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#282a36',
                            color: '#f8f8f2',
                            fontSize: '13px',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setShowStats(!showStats)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        backgroundColor: showStats ? '#4aed88' : '#282a36',
                        color: showStats ? '#000' : '#f8f8f2',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Toggle Statistics"
                >
                    <span>📊</span>
                    Stats
                </button>

                {showStats && (
                    <div style={{
                        position: 'absolute',
                        top: '50px',
                        right: '20px',
                        background: '#282a36',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        zIndex: 1000,
                        minWidth: '180px'
                    }}>
                        <div style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>Code Statistics</div>
                        <div style={{ fontSize: '14px', color: '#f8f8f2' }}>
                            <div>Lines: <strong style={{ color: '#4aed88' }}>{stats.lines}</strong></div>
                            <div>Characters: <strong style={{ color: '#4aed88' }}>{stats.characters}</strong></div>
                            <div>Words: <strong style={{ color: '#4aed88' }}>{stats.words}</strong></div>
                        </div>
                    </div>
                )}

                <button
                    onClick={onFormatCode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        backgroundColor: '#282a36',
                        color: '#f8f8f2',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Format Code"
                >
                    <span>✨</span>
                    Format
                </button>

                <button
                    onClick={copyCode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        backgroundColor: '#282a36',
                        color: '#f8f8f2',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Copy Code"
                >
                    <span>📋</span>
                    Copy
                </button>

                <button
                    onClick={downloadCode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        backgroundColor: '#282a36',
                        color: '#f8f8f2',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Download Code"
                >
                    <span>💾</span>
                    Download
                </button>

                <button
                    onClick={onClearCode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ff6b6b',
                        backgroundColor: '#282a36',
                        color: '#ff6b6b',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Clear All Code"
                >
                    <span>🗑️</span>
                    Clear
                </button>
            </div>
        </div>
    );
};

export default EditorToolbar;

