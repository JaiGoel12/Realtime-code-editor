import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import EditorToolbar from '../components/EditorToolbar';
import ConnectionStatus from '../components/ConnectionStatus';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [fontSize, setFontSize] = useState(16);
    const [code, setCode] = useState('');

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );

            // Listen for language changes from other users
            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ newLanguage }) => {
                setLanguage(newLanguage);
            });
        };
        init();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
            }
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied to clipboard!');
        } catch (err) {
            toast.error('Could not copy the Room ID');
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
        if (window.confirm('Are you sure you want to clear all code? This action cannot be undone.')) {
            if (editorRef.current) {
                editorRef.current.setValue('');
                handleCodeChange('');
                toast.success('Code cleared!');
            }
        }
    };

    const handleFormatCode = () => {
        if (!code || code.trim() === '') {
            toast.error('No code to format');
            return;
        }

        // Simple formatting for JSON
        if (language === 'json') {
            try {
                const parsed = JSON.parse(code);
                const formatted = JSON.stringify(parsed, null, 2);
                if (editorRef.current) {
                    editorRef.current.setValue(formatted);
                    handleCodeChange(formatted);
                    toast.success('Code formatted!');
                }
            } catch (e) {
                toast.error('Invalid JSON');
            }
        } else {
            toast.info('Auto-formatting available for JSON. Other languages coming soon!');
        }
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: '#0d1117',
            overflow: 'hidden'
        }}>
            {/* Modern Sidebar */}
            <div style={{
                width: '280px',
                background: 'linear-gradient(180deg, #1c1e29 0%, #161821 100%)',
                borderRight: '2px solid #2d2d44',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    padding: '20px',
                    borderBottom: '2px solid #2d2d44'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        <img
                            src="/code-sync.png"
                            alt="logo"
                            style={{ height: '50px', borderRadius: '8px' }}
                        />
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '18px',
                                color: '#4aed88',
                                fontWeight: '700'
                            }}>CodeSync</h2>
                            <div style={{
                                fontSize: '11px',
                                color: '#888',
                                marginTop: '2px'
                            }}>Real-time Editor</div>
                        </div>
                    </div>
                    <ConnectionStatus socketRef={socketRef} />
                </div>

                <div style={{
                    padding: '20px',
                    flex: 1,
                    overflowY: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#a0a0a0',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            👥 Collaborators ({clients.length})
                        </h3>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {clients.map((client) => (
                            <div key={client.socketId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'rgba(74, 237, 136, 0.05)',
                                border: '1px solid rgba(74, 237, 136, 0.2)',
                                transition: 'all 0.2s'
                            }}>
                                <Client username={client.username} />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: '20px',
                    borderTop: '2px solid #2d2d44',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(74, 237, 136, 0.1)',
                        border: '1px solid rgba(74, 237, 136, 0.3)'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#888',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>Room ID</div>
                        <div style={{
                            fontSize: '13px',
                            color: '#4aed88',
                            fontFamily: 'monospace',
                            fontWeight: '600',
                            wordBreak: 'break-all'
                        }}>{roomId}</div>
                    </div>
                    <button
                        onClick={copyRoomId}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4aed88 0%, #2b824c 100%)',
                            color: '#000',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(74, 237, 136, 0.3)'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        📋 Copy Room ID
                    </button>
                    <button
                        onClick={leaveRoom}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        🚪 Leave Room
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
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
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <Editor
                        ref={editorRef}
                        socketRef={socketRef}
                        roomId={roomId}
                        username={location.state?.username}
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
