/**
 * Escape HTML, then allow minimal inline **bold** and `code` only.
 */
export function renderRoomPinHtml(raw) {
    if (!raw) return '';
    const esc = (s) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    let s = esc(raw);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code class="cs-room-pin-code">$1</code>');
    return s;
}
