import React, { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/editor-ui.css';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import EditorToolbar from '../components/EditorToolbar';
import ConnectionStatus from '../components/ConnectionStatus';
import { initSocket } from '../socket';
import { useUser } from '@clerk/clerk-react';
import {
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const { user, isLoaded } = useUser();

    const collaboratorUsername = useMemo(() => {
        if (location.state?.username) {
            return location.state.username;
        }
        if (!user) return 'Guest';
        const emailLocal = user.primaryEmailAddress?.emailAddress?.split('@')[0];
        return (
            user.username ||
            user.firstName ||
            emailLocal ||
            'Guest'
        );
    }, [location.state?.username, user]);
    const [clients, setClients] = useState([]);
    const [typingSocketIds, setTypingSocketIds] = useState(() => new Set());
    const typingClearTimeoutsRef = useRef({});
    const [language, setLanguage] = useState('javascript');
    const [fontSize, setFontSize] = useState(16);
    const [code, setCode] = useState('');

    useEffect(() => {
        if (!isLoaded) {
            return undefined;
        }
        let cancelled = false;
        const init = async () => {
            const socket = await initSocket();
            if (cancelled) {
                socket.disconnect();
                return;
            }
            socketRef.current = socket;
            socket.on('connect_error', (err) => handleErrors(err));
            socket.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socket.emit(ACTIONS.JOIN, {
                roomId,
                username: collaboratorUsername,
            });

            socket.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== collaboratorUsername) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    socketRef.current?.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            socket.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    if (typingClearTimeoutsRef.current[socketId]) {
                        clearTimeout(typingClearTimeoutsRef.current[socketId]);
                        delete typingClearTimeoutsRef.current[socketId];
                    }
                    setTypingSocketIds((prev) => {
                        const next = new Set(prev);
                        next.delete(socketId);
                        return next;
                    });
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );

            socket.on(ACTIONS.LANGUAGE_CHANGE, ({ newLanguage }) => {
                setLanguage(newLanguage);
            });

            const scheduleTypingClear = (socketId) => {
                if (typingClearTimeoutsRef.current[socketId]) {
                    clearTimeout(typingClearTimeoutsRef.current[socketId]);
                }
                typingClearTimeoutsRef.current[socketId] = setTimeout(() => {
                    setTypingSocketIds((prev) => {
                        const next = new Set(prev);
                        next.delete(socketId);
                        return next;
                    });
                    delete typingClearTimeoutsRef.current[socketId];
                }, 1600);
            };

            socket.on(ACTIONS.TYPING, ({ socketId }) => {
                if (!socketId) return;
                setTypingSocketIds((prev) => {
                    const next = new Set(prev);
                    next.add(socketId);
                    return next;
                });
                scheduleTypingClear(socketId);
            });
        };
        init().catch((e) => console.error('Socket init failed', e));
        return () => {
            cancelled = true;
            Object.values(typingClearTimeoutsRef.current).forEach((t) =>
                clearTimeout(t)
            );
            typingClearTimeoutsRef.current = {};
            const s = socketRef.current;
            if (s) {
                s.off(ACTIONS.JOINED);
                s.off(ACTIONS.DISCONNECTED);
                s.off(ACTIONS.LANGUAGE_CHANGE);
                s.off(ACTIONS.TYPING);
                s.off('connect_error');
                s.off('connect_failed');
                s.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomId, collaboratorUsername, reactNavigator, isLoaded]);

    async function copyInviteLink() {
        const inviteUrl = `${window.location.origin}/room/${roomId}`;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Invite link copied! Others can sign in and join this room.');
        } catch (err) {
            toast.error('Could not copy the link');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    const handleCodeChange = (newCode) => {
        codeRef.current = newCode;
        setCode(newCode);
    };

    const handleClearCode = () => {
        if (
            !window.confirm(
                'Clear all code for everyone in this room? This cannot be undone.'
            )
        ) {
            return;
        }
        if (socketRef.current?.connected) {
            socketRef.current.emit(ACTIONS.CLEAR_CODE, { roomId });
            toast.success('Code cleared for everyone in the room');
        } else {
            toast.success('Code cleared locally');
        }
        if (editorRef.current) {
            editorRef.current.setValue('');
            handleCodeChange('');
        }
    };

    const handleFormatCode = () => {
        if (!code || code.trim() === '') {
            toast.error('No code to format');
            return;
        }

        let formatted = code;
        let success = false;

        // Format based on language
        if (language === 'json') {
            try {
                const parsed = JSON.parse(code);
                formatted = JSON.stringify(parsed, null, 2);
                success = true;
            } catch (e) {
                toast.error('Invalid JSON');
                return;
            }
        } else if (language === 'javascript' || language === 'typescript') {
            // Basic JavaScript/TypeScript formatting - indent properly
            formatted = formatJavaScript(code);
            success = true;
        } else if (language === 'html') {
            // Basic HTML formatting
            formatted = formatHTML(code);
            success = true;
        } else if (language === 'css') {
            // Basic CSS formatting
            formatted = formatCSS(code);
            success = true;
        } else {
            // For other languages, do basic indentation
            formatted = formatBasic(code);
            success = true;
        }

        if (success && editorRef.current) {
            editorRef.current.setValue(formatted);
            handleCodeChange(formatted);
            toast.success('Code formatted!');
        }
    };

    // Basic formatting functions
    const formatJavaScript = (code) => {
        // Simple indentation fix
        const lines = code.split('\n');
        let indent = 0;
        const indentSize = 4;
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '';
            
            // Decrease indent for closing braces/brackets
            if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) {
                indent = Math.max(0, indent - 1);
            }
            
            const formatted = ' '.repeat(indent * indentSize) + trimmed;
            
            // Increase indent for opening braces/brackets
            if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                indent++;
            }
            
            return formatted;
        }).join('\n');
    };

    const formatHTML = (code) => {
        // Basic HTML indentation
        const lines = code.split('\n');
        let indent = 0;
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '';
            
            if (trimmed.startsWith('</')) {
                indent = Math.max(0, indent - 1);
            }
            
            const formatted = ' '.repeat(indent * 2) + trimmed;
            
            if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
                indent++;
            }
            
            return formatted;
        }).join('\n');
    };

    const formatCSS = (code) => {
        // Basic CSS formatting
        let formatted = code
            .replace(/\s*{\s*/g, ' {\n    ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/\s*;\s*/g, ';\n    ')
            .replace(/\s*:\s*/g, ': ');
        
        // Clean up extra newlines
        formatted = formatted.replace(/\n\s*\n/g, '\n');
        return formatted.trim();
    };

    const formatBasic = (code) => {
        // Basic indentation for any language
        const lines = code.split('\n');
        let indent = 0;
        return lines.map(line => {
            const trimmed = line.trim();
            if (trimmed === '') return '';
            return ' '.repeat(indent * 4) + trimmed;
        }).join('\n');
    };

    if (!isLoaded) {
        return (
            <div className="cs-editor-loading">
                <div className="cs-loader-ring" aria-hidden />
                <span>Loading editor…</span>
            </div>
        );
    }

    return (
        <div className="cs-editor-root">
            <div className="cs-editor-ambient" aria-hidden>
                <div className="cs-editor-orb cs-editor-orb--1" />
                <div className="cs-editor-orb cs-editor-orb--2" />
                <div className="cs-editor-orb cs-editor-orb--3" />
                <div className="cs-editor-grid" />
                <div className="cs-editor-vignette" />
            </div>

            <aside className="cs-editor-sidebar">
                <div className="cs-sidebar-header">
                    <div className="cs-sidebar-brand-card">
                        <div className="cs-sidebar-brand">
                            <img src="/code-sync.png" alt="CodeSync" />
                            <div className="cs-sidebar-brand-text">
                                <span className="cs-sidebar-eyebrow">CodeSync</span>
                                <h2>
                                    Live{' '}
                                    <span className="cs-sidebar-title-accent">session</span>
                                </h2>
                                <span className="cs-sidebar-tagline">
                                    Realtime collaboration
                                </span>
                            </div>
                        </div>
                        <div className="cs-sidebar-status-row">
                            <ConnectionStatus socketRef={socketRef} />
                            <h3 className="cs-sidebar-section-title">
                                <span className="cs-live-dot" aria-hidden />
                                <span className="cs-sidebar-section-label">Squad</span>
                                <span className="cs-sidebar-section-count">
                                    {clients.length}
                                </span>
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="cs-sidebar-main">
                    <div className="cs-collab-list">
                        {clients.map((client) => {
                            const isTyping = typingSocketIds.has(client.socketId);
                            return (
                                <div
                                    key={client.socketId}
                                    className={
                                        'cs-collab-row' +
                                        (isTyping ? ' cs-collab-row--typing' : '')
                                    }
                                >
                                    <Client username={client.username} isTyping={isTyping} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="cs-sidebar-footer">
                    <button
                        type="button"
                        className="cs-btn cs-btn--invite"
                        onClick={copyInviteLink}
                    >
                        <span className="cs-btn-glow" aria-hidden />
                        <span className="cs-btn-label">Copy invite link</span>
                    </button>
                    <button
                        type="button"
                        className="cs-btn cs-btn--leave"
                        onClick={leaveRoom}
                    >
                        <span className="cs-btn-label">Leave room</span>
                    </button>
                </div>
            </aside>

            <div className="cs-editor-main">
                <EditorToolbar
                    currentLanguage={language}
                    onLanguageChange={setLanguage}
                    socketRef={socketRef}
                    roomId={roomId}
                    code={code}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    onClearCode={handleClearCode}
                    onFormatCode={handleFormatCode}
                />
                <div className="cs-editor-cm-wrap">
                    <Editor
                        ref={editorRef}
                        socketRef={socketRef}
                        roomId={roomId}
                        username={collaboratorUsername}
                        language={language}
                        fontSize={fontSize}
                        onLanguageChange={setLanguage}
                        onCodeChange={handleCodeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
