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
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                
                // Ignore changes from remote updates
                if (isRemoteChangeRef.current || origin === 'setValue') {
                    return;
                }

                const code = instance.getValue();
                onCodeChange(code);

                // Send incremental change
                changes.forEach((change) => {
                    const from = change.from;
                    const to = change.to;
                    const text = change.text.join('\n');
                    const removed = change.removed.join('\n');

                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        from,
                        to,
                        text,
                        removed,
                    });
                });
            });

            // Track cursor position and send updates
            editorRef.current.on('cursorActivity', (instance) => {
                if (isRemoteChangeRef.current) return;

                // Debounce cursor updates
                if (cursorUpdateTimeoutRef.current) {
                    clearTimeout(cursorUpdateTimeoutRef.current);
                }

                cursorUpdateTimeoutRef.current = setTimeout(() => {
                    const cursor = instance.getCursor();
                    socketRef.current.emit(ACTIONS.CURSOR_POSITION, {
                        roomId,
                        cursor: { line: cursor.line, ch: cursor.ch },
                    });
                }, 100);
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            // Handle remote code changes - apply at specific positions
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ from, to, text, removed }) => {
                if (!editorRef.current) return;

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
                    console.error('Error applying remote change:', error);
                }

                isRemoteChangeRef.current = false;
            });

            // Handle remote cursor positions
            socketRef.current.on(ACTIONS.CURSOR_UPDATE, ({ socketId, cursor, username: remoteUsername }) => {
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
            });

            // Handle full code sync (for new users joining)
            socketRef.current.on(ACTIONS.SYNC_CODE, ({ code }) => {
                if (!editorRef.current || !code) return;
                isRemoteChangeRef.current = true;
                editorRef.current.setValue(code);
                onCodeChange(code);
                isRemoteChangeRef.current = false;
            });

            // Handle user disconnection - clean up their cursor
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId }) => {
                if (remoteCursorsRef.current[socketId]) {
                    try {
                        remoteCursorsRef.current[socketId].clear();
                    } catch (e) {
                        // Marker might already be cleared
                    }
                    delete remoteCursorsRef.current[socketId];
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.CURSOR_UPDATE);
                socketRef.current.off(ACTIONS.SYNC_CODE);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        };
    }, [socketRef.current]);

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
