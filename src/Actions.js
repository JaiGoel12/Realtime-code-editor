const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    CLEAR_CODE: 'clear-code',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
    CURSOR_POSITION: 'cursor-position',
    CURSOR_UPDATE: 'cursor-update',
    LANGUAGE_CHANGE: 'language-change',
    TYPING: 'typing',
    /** Server-emitted: who edited which line range, when (audit / activity feed). */
    EDIT_LOG: 'edit-log',
};

module.exports = ACTIONS;
