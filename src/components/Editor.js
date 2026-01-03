import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/display/placeholder';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange, username }) => {
    const editorRef = useRef(null);
    const isRemoteChangeRef = useRef(false);
    const remoteCursorsRef = useRef({});
    const cursorUpdateTimeoutRef = useRef(null);

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Handle local changes - send incremental updates
            editorRef.current.on('change', (instance, changeObj) => {
                const { origin } = changeObj;
                
                // Ignore changes from remote updates
                if (isRemoteChangeRef.current || origin === 'setValue') {
                    return;
                }

                // Make sure socket is available
                if (!socketRef.current || !socketRef.current.connected) {
                    console.warn('Socket not connected, cannot send changes');
                    return;
                }

                const code = instance.getValue();
                onCodeChange(code);

                // CodeMirror change object structure
                // changeObj has: from, to, text (array), removed (array), origin
                const from = { line: changeObj.from.line, ch: changeObj.from.ch };
                const to = { line: changeObj.to.line, ch: changeObj.to.ch };
                const text = changeObj.text.join('\n');
                const removed = changeObj.removed.join('\n');

                if (socketRef.current && socketRef.current.connected) {
                    console.log('Sending change:', { from, to, text: text.substring(0, 20) });
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

    // Set up socket listeners - use a polling approach to check when socket is ready
    useEffect(() => {
        const setupSocketListeners = () => {
            if (!socketRef.current || !editorRef.current) {
                return false;
            }

            // Handle remote code changes - apply at specific positions
            const handleCodeChange = ({ from, to, text, removed }) => {
                if (!editorRef.current) {
                    console.warn('Editor not ready for remote change');
                    return;
                }
                if (!from || !to) {
                    console.error('Invalid change data:', { from, to, text, removed });
                    return;
                }

                console.log('Receiving change:', { from, to, text: text ? text.substring(0, 20) : 'empty' });

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
                    console.error('Error applying remote change:', error, { from, to, text });
                }

                isRemoteChangeRef.current = false;
            };

            // Handle remote cursor positions
            const handleCursorUpdate = ({ socketId, cursor, username: remoteUsername }) => {
                if (!editorRef.current || !cursor) return;

                // Don't show cursor for current user
                if (socketId === socketRef.current.id) return;

                // Remove old cursor marker for this user
                if (remoteCursorsRef.current[socketId]) {
                    try {
                        remoteCursorsRef.current[socketId].clear();
                    } catch (e) {
                        // Marker might already be cleared
                    }
                    delete remoteCursorsRef.current[socketId];
                }

                // Create new cursor marker
                try {
                    const marker = editorRef.current.setBookmark(
                        { line: cursor.line, ch: cursor.ch },
                        {
                            widget: createCursorWidget(remoteUsername),
                            insertLeft: true,
                        }
                    );

                    remoteCursorsRef.current[socketId] = marker;
                } catch (error) {
                    console.error('Error creating cursor marker:', error);
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

            // Handle user disconnection - clean up their cursor
            const handleDisconnected = ({ socketId }) => {
                if (remoteCursorsRef.current[socketId]) {
                    try {
                        remoteCursorsRef.current[socketId].clear();
                    } catch (e) {
                        // Marker might already be cleared
                    }
                    delete remoteCursorsRef.current[socketId];
                }
            };

            // Remove existing listeners to avoid duplicates
            socketRef.current.off(ACTIONS.CODE_CHANGE);
            socketRef.current.off(ACTIONS.CURSOR_UPDATE);
            socketRef.current.off(ACTIONS.SYNC_CODE);
            socketRef.current.off(ACTIONS.DISCONNECTED);

            // Set up all listeners
            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);
            socketRef.current.on(ACTIONS.CURSOR_UPDATE, handleCursorUpdate);
            socketRef.current.on(ACTIONS.SYNC_CODE, handleSyncCode);
            socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnected);

            console.log('Socket listeners set up successfully');
            return true;
        };

        // Try to set up listeners immediately
        if (setupSocketListeners()) {
            return;
        }

        // If not ready, poll every 100ms until socket and editor are ready
        const interval = setInterval(() => {
            if (setupSocketListeners()) {
                clearInterval(interval);
            }
        }, 100);

        // Also try when socket connects
        const onConnect = () => {
            setupSocketListeners();
        };
        if (socketRef.current) {
            socketRef.current.on('connect', onConnect);
        }

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.off('connect', onConnect);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.CURSOR_UPDATE);
                socketRef.current.off(ACTIONS.SYNC_CODE);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        };
    }, [roomId, onCodeChange]);

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
};

// Create a visual widget for remote cursors
function createCursorWidget(username) {
    const widget = document.createElement('span');
    widget.className = 'remote-cursor';
    widget.style.borderLeft = '2px solid #4aed88';
    widget.style.marginLeft = '-1px';
    widget.style.height = '1.2em';
    widget.style.position = 'relative';
    widget.style.display = 'inline-block';
    widget.style.width = '2px';
    widget.style.backgroundColor = '#4aed88';
    widget.style.opacity = '0.7';
    
    // Add username label
    const label = document.createElement('span');
    label.className = 'remote-cursor-label';
    label.textContent = username;
    label.style.position = 'absolute';
    label.style.top = '-20px';
    label.style.left = '0';
    label.style.background = '#4aed88';
    label.style.color = '#000';
    label.style.padding = '2px 6px';
    label.style.borderRadius = '3px';
    label.style.fontSize = '12px';
    label.style.whiteSpace = 'nowrap';
    label.style.zIndex = '1000';
    label.style.pointerEvents = 'none';
    widget.appendChild(label);

    return widget;
}

export default Editor;
