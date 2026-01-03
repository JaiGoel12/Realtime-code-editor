// Generate unique colors for different users
const COLORS = [
    '#4aed88', // Green
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#45b7d1', // Blue
    '#f7b731', // Yellow
    '#a55eea', // Purple
    '#fd79a8', // Pink
    '#00b894', // Mint
    '#e17055', // Orange
    '#74b9ff', // Light Blue
];

// Map socket IDs to colors
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

