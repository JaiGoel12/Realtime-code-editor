import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

// Import language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike'; // For C, C++, Java
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/php/php';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/go/go';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/swift/swift';

import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/display/placeholder';
import ACTIONS from '../Actions';
import { getUserColor, removeUserColor } from '../utils/colors';
import { getLanguageMode } from '../utils/languages';

const Editor = React.forwardRef(({ socketRef, roomId, onCodeChange, username, language = 'javascript', onLanguageChange, fontSize = 16 }, ref) => {
    const editorRef = useRef(null);
    const isRemoteChangeRef = useRef(false);
    const remoteCursorsRef = useRef({});
    const cursorUpdateTimeoutRef = useRef(null);
    const handlersRef = useRef({});
    const listenersSetupRef = useRef(false);

    // Expose editor instance via ref
    React.useImperativeHandle(ref, () => ({
        getValue: () => editorRef.current?.getValue() || '',
        setValue: (value) => {
            if (editorRef.current) {
                isRemoteChangeRef.current = true;
                editorRef.current.setValue(value);
                isRemoteChangeRef.current = false;
            }
        }
    }));

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: getLanguageMode(language),
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    indentUnit: 4,
                    indentWithTabs: false,
                    lineWrapping: true,
                    fontSize: fontSize,
                }
            );
            
            // Set font size
            editorRef.current.getWrapperElement().style.fontSize = `${fontSize}px`;

            // Handle local changes - send incremental updates
            editorRef.current.on('change', (instance, changeObj) => {
                const { origin } = changeObj;
                
                // Ignore changes from remote updates
                if (isRemoteChangeRef.current || origin === 'setValue') {
                    return;
                }

                // Make sure socket is available
                if (!socketRef.current || !socketRef.current.connected) {
                    return;
                }

                const code = instance.getValue();
                onCodeChange(code);

                // CodeMirror change object structure
                const from = { line: changeObj.from.line, ch: changeObj.from.ch };
                const to = { line: changeObj.to.line, ch: changeObj.to.ch };
                const text = changeObj.text.join('\n');
                const removed = changeObj.removed.join('\n');

                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        from,
                        to,
                        text,
                        removed,
                    });
                }
            });

            // Track cursor position and send updates
            editorRef.current.on('cursorActivity', (instance) => {
                if (isRemoteChangeRef.current) return;
                if (!socketRef.current || !socketRef.current.connected) return;

                // Debounce cursor updates
                if (cursorUpdateTimeoutRef.current) {
                    clearTimeout(cursorUpdateTimeoutRef.current);
                }

                cursorUpdateTimeoutRef.current = setTimeout(() => {
                    if (socketRef.current && socketRef.current.connected) {
                        const cursor = instance.getCursor();
                        socketRef.current.emit(ACTIONS.CURSOR_POSITION, {
                            roomId,
                            cursor: { line: cursor.line, ch: cursor.ch },
                        });
                    }
                }, 100);
            });
        }
        init();
    }, []);

    // Update language when it changes
    useEffect(() => {
        if (editorRef.current && language) {
            editorRef.current.setOption('mode', getLanguageMode(language));
        }
    }, [language]);

    // Update font size when it changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.getWrapperElement().style.fontSize = `${fontSize}px`;
            editorRef.current.refresh();
        }
    }, [fontSize]);

    // Set up socket listeners - ensure they persist
    useEffect(() => {
        const setupListeners = () => {
            if (!socketRef.current || !editorRef.current) {
                return false;
            }

            // Make sure socket is connected
            if (!socketRef.current.connected) {
                return false;
            }

            // Only set up listeners once
            if (listenersSetupRef.current) {
                return true;
            }

            // Handle remote code changes - apply at specific positions
            const handleCodeChange = ({ from, to, text, removed }) => {
                if (!editorRef.current) {
                    return;
                }
                if (!from || !to) {
                    return;
                }

                isRemoteChangeRef.current = true;

                try {
                    // Convert line/ch to CodeMirror position objects
                    const fromPos = { line: from.line, ch: from.ch };
                    const toPos = { line: to.line, ch: to.ch };

                    // Apply the change
                    editorRef.current.replaceRange(text, fromPos, toPos);
                    
                    const code = editorRef.current.getValue();
                    onCodeChange(code);
                } catch (error) {
                    // Silently handle errors
                }

                isRemoteChangeRef.current = false;
            };

            // Handle remote cursor positions
            const handleCursorUpdate = ({ socketId, cursor, username: remoteUsername }) => {
                if (!editorRef.current || !cursor) return;

                // Don't show cursor for current user
                if (socketId === socketRef.current.id) return;

                // Get unique color for this user
                const userColor = getUserColor(socketId);

                // Remove old cursor marker for this user
                if (remoteCursorsRef.current[socketId]) {
                    try {
                        remoteCursorsRef.current[socketId].clear();
                    } catch (e) {
                        // Marker might already be cleared
                    }
                    delete remoteCursorsRef.current[socketId];
                }

                // Create new cursor marker with user's color
                try {
                    const marker = editorRef.current.setBookmark(
                        { line: cursor.line, ch: cursor.ch },
                        {
                            widget: createCursorWidget(remoteUsername, userColor),
                            insertLeft: true,
                        }
                    );

                    remoteCursorsRef.current[socketId] = marker;
                } catch (error) {
                    // Silently handle errors
                }
            };

            // Handle full code sync (for new users joining)
            const handleSyncCode = ({ code }) => {
                if (!editorRef.current || !code) return;
                isRemoteChangeRef.current = true;
                editorRef.current.setValue(code);
                onCodeChange(code);
                isRemoteChangeRef.current = false;
            };

            // Handle language change
            const handleLanguageChange = ({ newLanguage }) => {
                if (editorRef.current && newLanguage) {
                    editorRef.current.setOption('mode', getLanguageMode(newLanguage));
                    if (onLanguageChange) {
                        onLanguageChange(newLanguage);
                    }
                }
            };

            // Handle user disconnection - clean up their cursor
            const handleDisconnected = ({ socketId }) => {
                if (remoteCursorsRef.current[socketId]) {
                    try {
                        remoteCursorsRef.current[socketId].clear();
                    } catch (e) {
                        // Marker might already be cleared
                    }
                    delete remoteCursorsRef.current[socketId];
                    removeUserColor(socketId);
                }
            };

            // Store handlers in ref so we can remove them properly
            handlersRef.current = {
                handleCodeChange,
                handleCursorUpdate,
                handleSyncCode,
                handleLanguageChange,
                handleDisconnected,
            };

            // Set up all listeners
            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
            socketRef.current.on(ACTIONS.CURSOR_UPDATE, handleCursorUpdate);
            socketRef.current.on(ACTIONS.SYNC_CODE, handleSyncCode);
            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, handleLanguageChange);
            socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnected);

            listenersSetupRef.current = true;
            return true;
        };

        // Try to set up immediately
        if (setupListeners()) {
            return () => {
                // Cleanup on unmount
                if (socketRef.current && handlersRef.current) {
                    socketRef.current.off(ACTIONS.CODE_CHANGE, handlersRef.current.handleCodeChange);
                    socketRef.current.off(ACTIONS.CURSOR_UPDATE, handlersRef.current.handleCursorUpdate);
                    socketRef.current.off(ACTIONS.SYNC_CODE, handlersRef.current.handleSyncCode);
                    socketRef.current.off(ACTIONS.LANGUAGE_CHANGE, handlersRef.current.handleLanguageChange);
                    socketRef.current.off(ACTIONS.DISCONNECTED, handlersRef.current.handleDisconnected);
                    listenersSetupRef.current = false;
                }
            };
        }

        // Poll until ready
        const interval = setInterval(() => {
            if (setupListeners()) {
                clearInterval(interval);
            }
        }, 100);

        // Also try on connect
        const onConnect = () => {
            setupListeners();
        };
        if (socketRef.current) {
            socketRef.current.on('connect', onConnect);
        }

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.off('connect', onConnect);
                if (handlersRef.current) {
                    socketRef.current.off(ACTIONS.CODE_CHANGE, handlersRef.current.handleCodeChange);
                    socketRef.current.off(ACTIONS.CURSOR_UPDATE, handlersRef.current.handleCursorUpdate);
                    socketRef.current.off(ACTIONS.SYNC_CODE, handlersRef.current.handleSyncCode);
                    socketRef.current.off(ACTIONS.LANGUAGE_CHANGE, handlersRef.current.handleLanguageChange);
                    socketRef.current.off(ACTIONS.DISCONNECTED, handlersRef.current.handleDisconnected);
                }
                listenersSetupRef.current = false;
            }
        };
    }, [roomId, onCodeChange, onLanguageChange]);

    // Cleanup cursor markers on unmount
    useEffect(() => {
        return () => {
            Object.values(remoteCursorsRef.current).forEach((marker) => {
                if (marker && marker.clear) marker.clear();
            });
            if (cursorUpdateTimeoutRef.current) {
                clearTimeout(cursorUpdateTimeoutRef.current);
            }
        };
    }, []);

    return <textarea id="realtimeEditor"></textarea>;
});

Editor.displayName = 'Editor';

// Create a visual widget for remote cursors with unique colors
function createCursorWidget(username, color) {
    const widget = document.createElement('span');
    widget.className = 'remote-cursor';
    widget.style.borderLeft = `2px solid ${color}`;
    widget.style.marginLeft = '-1px';
    widget.style.height = '1.2em';
    widget.style.position = 'relative';
    widget.style.display = 'inline-block';
    widget.style.width = '2px';
    widget.style.backgroundColor = color;
    widget.style.opacity = '0.8';
    widget.style.transition = 'opacity 0.2s';
    
    // Add username label with user's color
    const label = document.createElement('span');
    label.className = 'remote-cursor-label';
    label.textContent = username;
    label.style.position = 'absolute';
    label.style.top = '-20px';
    label.style.left = '0';
    label.style.background = color;
    label.style.color = '#fff';
    label.style.padding = '2px 8px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '11px';
    label.style.fontWeight = '500';
    label.style.whiteSpace = 'nowrap';
    label.style.zIndex = '1000';
    label.style.pointerEvents = 'none';
    label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    widget.appendChild(label);

    return widget;
}

export default Editor;
