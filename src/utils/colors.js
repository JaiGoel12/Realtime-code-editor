// Collaborator cursor hues — cool blue / cyan / violet (Antigravity-adjacent)
const COLORS = [
    '#8ab4f8',
    '#5ad0ff',
    '#669df6',
    '#c5a8ff',
    '#a8c7fa',
    '#7ec8ff',
    '#b39ddb',
    '#64b5f6',
    '#90caf9',
    '#4fc3f7',
];

const userColorMap = new Map();

export function getUserColor(socketId) {
    if (!userColorMap.has(socketId)) {
        const colorIndex = userColorMap.size % COLORS.length;
        userColorMap.set(socketId, COLORS[colorIndex]);
    }
    return userColorMap.get(socketId);
}

export function removeUserColor(socketId) {
    userColorMap.delete(socketId);
}
