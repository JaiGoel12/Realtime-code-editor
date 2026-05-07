import React, { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/editor-ui.css';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import EditorToolbar from '../components/EditorToolbar';
import ConnectionStatus from '../components/ConnectionStatus';
import ThemeToggle from '../components/ThemeToggle';
import { initSocket } from '../socket';
import {
    getSoundsEnabled,
    setSoundsEnabled as persistSoundsEnabled,
    playJoinChime,
    playLeaveChime,
} from '../utils/sounds';
import {
    getCollaboratorDisplayName,
    getCollaboratorImageUrl,
} from '../utils/collaboratorProfile';
import { useUser } from '@clerk/clerk-react';
import {
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

const MAX_EDIT_LOG = 80;
/** Merge rapid keystrokes from the same user on nearby lines into one entry. */
const EDIT_MERGE_MS = 2400;

function formatEditTimeShort(iso) {
    try {
        return new Date(iso).toLocaleTimeString(undefined, {
            timeStyle: 'short',
        });
    } catch {
        return '';
    }
}

function editLineRangeLabel(fromLine, toLine) {
    const a = (typeof fromLine === 'number' ? fromLine : 0) + 1;
    const b = (typeof toLine === 'number' ? toLine : 0) + 1;
    return a === b ? `Line ${a}` : `Lines ${a}–${b}`;
}

function lineSpansClose(aFrom, aTo, bFrom, bTo) {
    const a0 = Math.min(aFrom, aTo);
    const a1 = Math.max(aFrom, aTo);
    const b0 = Math.min(bFrom, bTo);
    const b1 = Math.max(bFrom, bTo);
    return b0 <= a1 + 1 && b1 >= a0 - 1;
}

function mergeEditEntries(head, incoming) {
    const t0 = new Date(head.editedAt).getTime();
    const t1 = new Date(incoming.editedAt).getTime();
    if (Number.isNaN(t0) || Number.isNaN(t1) || t1 - t0 > EDIT_MERGE_MS) {
        return null;
    }
    if (head.socketId !== incoming.socketId) return null;
    if (
        !lineSpansClose(
            head.fromLine,
            head.toLine,
            incoming.fromLine,
            incoming.toLine
        )
    ) {
        return null;
    }
    const p0 = typeof head.preview === 'string' ? head.preview : '';
    const p1 = typeof incoming.preview === 'string' ? incoming.preview : '';
    const preview = (p0 + p1).slice(0, 140);
    const kind =
        head.kind === incoming.kind ? head.kind : 'edit';
    return {
        ...incoming,
        displayName: incoming.displayName || head.displayName,
        editedAt: incoming.editedAt,
        fromLine: Math.min(head.fromLine, incoming.fromLine),
        toLine: Math.max(head.toLine, incoming.toLine),
        kind,
        preview: preview || undefined,
        _key: head._key,
    };
}

function appendEditLog(prev, payload) {
    const base = {
        ...payload,
        _key: `${payload.editedAt}:${payload.socketId}:${Math.random().toString(36).slice(2, 11)}`,
    };
    const head = prev[0];
    if (head) {
        const merged = mergeEditEntries(head, base);
        if (merged) {
            return [merged, ...prev.slice(1)].slice(0, MAX_EDIT_LOG);
        }
    }
    return [base, ...prev].slice(0, MAX_EDIT_LOG);
}

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const { user, isLoaded } = useUser();

    const collaboratorDisplayName = useMemo(
        () => getCollaboratorDisplayName(user, location.state),
        [user, location.state]
    );
    const collaboratorImageUrl = useMemo(
        () => getCollaboratorImageUrl(user),
        [user]
    );
    const [clients, setClients] = useState([]);
    const [typingSocketIds, setTypingSocketIds] = useState(() => new Set());
    const typingClearTimeoutsRef = useRef({});
    const [language, setLanguage] = useState('javascript');
    const [fontSize, setFontSize] = useState(16);
    const [code, setCode] = useState('');
    const [zenMode, setZenMode] = useState(false);
    const [followSocketId, setFollowSocketId] = useState(null);
    const followSocketIdRef = useRef(null);
    const [mySocketId, setMySocketId] = useState(null);
    const connectIdHandlerRef = useRef(null);
    const [soundsEnabled, setSoundsEnabled] = useState(() =>
        getSoundsEnabled()
    );
    const [editLog, setEditLog] = useState([]);
    const [editHistoryOpen, setEditHistoryOpen] = useState(false);

    const lineActivityRows = useMemo(() => {
        const best = new Map();
        for (const e of editLog) {
            const anchor = Math.min(
                typeof e.fromLine === 'number' ? e.fromLine : 0,
                typeof e.toLine === 'number' ? e.toLine : 0
            );
            const prev = best.get(anchor);
            const t = new Date(e.editedAt).getTime();
            const pt = prev ? new Date(prev.editedAt).getTime() : -1;
            if (!prev || t >= pt) {
                best.set(anchor, { ...e, anchorLine: anchor });
            }
        }
        return Array.from(best.values()).sort(
            (a, b) => a.anchorLine - b.anchorLine
        );
    }, [editLog]);

    useEffect(() => {
        followSocketIdRef.current = followSocketId;
    }, [followSocketId]);

    useEffect(() => {
        if (!followSocketId) return;
        if (!clients.some((c) => c.socketId === followSocketId)) {
            setFollowSocketId(null);
        }
    }, [clients, followSocketId]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            setFollowSocketId(null);
            setZenMode(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

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
            connectIdHandlerRef.current = () => setMySocketId(socket.id);
            socket.on('connect', connectIdHandlerRef.current);
            connectIdHandlerRef.current();
            socket.on('connect_error', (err) => handleErrors(err));
            socket.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socket.emit(ACTIONS.JOIN, {
                roomId,
                displayName: collaboratorDisplayName,
                imageUrl: collaboratorImageUrl,
            });

            socket.on(
                ACTIONS.JOINED,
                ({ clients, displayName: joinedName, username: joinedLegacy, socketId }) => {
                    if (socketId !== socket.id) {
                        playJoinChime();
                    }
                    const joined =
                        (typeof joinedName === 'string' && joinedName) ||
                        (typeof joinedLegacy === 'string' && joinedLegacy) ||
                        'Someone';
                    if (joined !== collaboratorDisplayName) {
                        toast.success(`${joined} joined the room.`);
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
                ({ socketId }) => {
                    playLeaveChime();
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

            socket.on(ACTIONS.EDIT_LOG, (payload) => {
                if (!payload || typeof payload.editedAt !== 'string') return;
                setEditLog((prev) => appendEditLog(prev, payload));
            });

            socket.on(ACTIONS.CLEAR_CODE, () => {
                setEditLog([]);
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
                if (connectIdHandlerRef.current) {
                    s.off('connect', connectIdHandlerRef.current);
                }
                s.off(ACTIONS.JOINED);
                s.off(ACTIONS.DISCONNECTED);
                s.off(ACTIONS.LANGUAGE_CHANGE);
                s.off(ACTIONS.TYPING);
                s.off(ACTIONS.EDIT_LOG);
                s.off(ACTIONS.CLEAR_CODE);
                s.off('connect_error');
                s.off('connect_failed');
                s.disconnect();
                socketRef.current = null;
            }
            setMySocketId(null);
        };
    }, [
        roomId,
        collaboratorDisplayName,
        collaboratorImageUrl,
        reactNavigator,
        isLoaded,
    ]);

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

    const toggleFollowCollaborator = (client) => {
        if (!mySocketId || client.socketId === mySocketId) return;
        const prev = followSocketIdRef.current;
        const next = prev === client.socketId ? null : client.socketId;
        setFollowSocketId(next);
        // Toast must not run inside setState updater — React Strict Mode runs that twice in dev.
        if (next) {
            toast.success(
                `Following ${client.displayName || client.username || 'teammate'}`
            );
        }
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
        <div
            className={
                'cs-editor-root' + (zenMode ? ' cs-editor-root--zen' : '')
            }
        >
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
                    <p className="cs-sidebar-follow-hint">
                        Tap a teammate to follow their cursor —{' '}
                        <kbd className="cs-kbd">Esc</kbd> to stop
                    </p>
                    <div className="cs-collab-list">
                        {clients.map((client) => {
                            const isTyping = typingSocketIds.has(client.socketId);
                            const isSelf = mySocketId === client.socketId;
                            const isFollowing =
                                followSocketId === client.socketId;
                            return (
                                <div
                                    key={client.socketId}
                                    className={
                                        'cs-collab-row' +
                                        (isTyping ? ' cs-collab-row--typing' : '') +
                                        (isFollowing ? ' cs-collab-row--follow' : '') +
                                        (isSelf ? ' cs-collab-row--self' : '')
                                    }
                                    role={isSelf ? undefined : 'button'}
                                    tabIndex={isSelf ? undefined : 0}
                                    onClick={() =>
                                        !isSelf &&
                                        toggleFollowCollaborator(client)
                                    }
                                    onKeyDown={(e) => {
                                        if (isSelf) return;
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleFollowCollaborator(client);
                                        }
                                    }}
                                >
                                    <Client
                                        displayName={
                                            client.displayName ||
                                            client.username ||
                                            'Guest'
                                        }
                                        imageUrl={client.imageUrl || ''}
                                        isTyping={isTyping}
                                        isFollowing={isFollowing}
                                        isSelf={isSelf}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className={
                        'cs-edit-history' +
                        (editHistoryOpen ? ' cs-edit-history--open' : '')
                    }
                >
                    <button
                        type="button"
                        className="cs-edit-history-toggle"
                        aria-expanded={editHistoryOpen}
                        onClick={() => setEditHistoryOpen((o) => !o)}
                    >
                        <span className="cs-edit-history-toggle-label">
                            Line activity
                        </span>
                        <span className="cs-edit-history-toggle-meta">
                            {lineActivityRows.length === 0
                                ? 'No edits yet'
                                : `${lineActivityRows.length} line${
                                      lineActivityRows.length === 1 ? '' : 's'
                                  } · tap to ${editHistoryOpen ? 'hide' : 'show'}`}
                        </span>
                        <span
                            className="cs-edit-history-chevron"
                            aria-hidden
                        >
                            {editHistoryOpen ? '▾' : '▸'}
                        </span>
                    </button>
                    {editHistoryOpen ? (
                        <>
                            <p className="cs-edit-history-sub">
                                Latest change per line · bursts of typing are
                                grouped · server time
                            </p>
                            <ul
                                className="cs-edit-history-list cs-edit-history-list--lines"
                                aria-label="Latest edit per line"
                            >
                                {lineActivityRows.length === 0 ? (
                                    <li className="cs-edit-history-empty">
                                        Edits will appear here by line as you
                                        work.
                                    </li>
                                ) : (
                                    lineActivityRows.map((e) => (
                                        <li
                                            key={e.anchorLine}
                                            className="cs-edit-history-line-row"
                                        >
                                            <span className="cs-edit-history-line-num">
                                                {editLineRangeLabel(
                                                    e.fromLine,
                                                    e.toLine
                                                )}
                                            </span>
                                            <span className="cs-edit-history-line-main">
                                                <span className="cs-edit-history-who">
                                                    {e.displayName || 'Guest'}
                                                </span>
                                                <time
                                                    className="cs-edit-history-time"
                                                    dateTime={e.editedAt}
                                                >
                                                    {formatEditTimeShort(
                                                        e.editedAt
                                                    )}
                                                </time>
                                                <span
                                                    className="cs-edit-history-kind cs-edit-history-kind--inline"
                                                >
                                                    {e.kind}
                                                </span>
                                            </span>
                                            {e.preview ? (
                                                <span className="cs-edit-history-preview-inline">
                                                    {e.preview}
                                                </span>
                                            ) : null}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </>
                    ) : null}
                </div>

                <div className="cs-sidebar-footer">
                    <div className="cs-sidebar-footer-settings">
                        <ThemeToggle className="cs-sidebar-theme-toggle" />
                        <label className="cs-sound-toggle">
                            <input
                                type="checkbox"
                                checked={soundsEnabled}
                                onChange={(e) => {
                                    const on = e.target.checked;
                                    persistSoundsEnabled(on);
                                    setSoundsEnabled(on);
                                }}
                            />
                            <span className="cs-sound-toggle-label">
                                Join / leave sounds
                            </span>
                        </label>
                    </div>
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
                    zenMode={zenMode}
                    onZenToggle={() => setZenMode((z) => !z)}
                />
                <div className="cs-editor-cm-wrap">
                    <Editor
                        ref={editorRef}
                        socketRef={socketRef}
                        roomId={roomId}
                        displayName={collaboratorDisplayName}
                        language={language}
                        fontSize={fontSize}
                        onLanguageChange={setLanguage}
                        onCodeChange={handleCodeChange}
                        followSocketId={followSocketId}
                    />
                </div>
            </div>

            {zenMode && (
                <button
                    type="button"
                    className="cs-zen-exit"
                    onClick={() => setZenMode(false)}
                >
                    Exit focus
                    <span className="cs-zen-exit-hint">Esc</span>
                </button>
            )}
        </div>
    );
};

export default EditorPage;
