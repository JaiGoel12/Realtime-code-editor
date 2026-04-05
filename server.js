const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

/** @type {Record<string, { displayName: string; imageUrl: string }>} */
const userSocketMap = {};
/** @type {Map<string, string>} */
const roomPins = new Map();

function sanitizeDisplayName(displayName, username) {
    if (typeof displayName === 'string' && displayName.trim()) {
        return displayName.trim().slice(0, 80);
    }
    if (typeof username === 'string' && username.trim()) {
        return username.trim().slice(0, 80);
    }
    return 'Guest';
}

function sanitizeImageUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return '';
    const t = url.trim().slice(0, 2048);
    if (!/^https?:\/\//i.test(t)) return '';
    return t;
}

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            const info = userSocketMap[socketId];
            return {
                socketId,
                displayName: info?.displayName ?? 'Guest',
                imageUrl: info?.imageUrl ?? '',
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, displayName, imageUrl, username }) => {
        const name = sanitizeDisplayName(displayName, username);
        const img = sanitizeImageUrl(imageUrl);
        userSocketMap[socket.id] = { displayName: name, imageUrl: img };
        socket.join(roomId);
        socket.emit(ACTIONS.ROOM_PIN_SYNC, {
            note: roomPins.get(roomId) || '',
        });
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                displayName: name,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, from, to, text, removed }) => {
        // Broadcast incremental change to all other clients in the room
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {
            from,
            to,
            text,
            removed,
        });
    });

    socket.on(ACTIONS.CLEAR_CODE, ({ roomId }) => {
        if (!roomId) return;
        // Everyone in the room (including sender) clears in sync
        io.to(roomId).emit(ACTIONS.CLEAR_CODE);
    });

    socket.on(ACTIONS.TYPING, ({ roomId }) => {
        if (!roomId) return;
        // Include sender so their own collaborator row highlights (socket.in excludes self)
        io.to(roomId).emit(ACTIONS.TYPING, { socketId: socket.id });
    });

    socket.on(ACTIONS.CURSOR_POSITION, ({ roomId, cursor }) => {
        const info = userSocketMap[socket.id];
        const label = info?.displayName ?? 'User';
        socket.in(roomId).emit(ACTIONS.CURSOR_UPDATE, {
            socketId: socket.id,
            cursor,
            displayName: label,
            username: label,
        });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        // Send full code to newly joined user
        io.to(socketId).emit(ACTIONS.SYNC_CODE, { code });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, newLanguage }) => {
        // Broadcast language change to all clients in the room
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, {
            newLanguage,
        });
    });

    socket.on(ACTIONS.ROOM_PIN_SET, ({ roomId, note }) => {
        if (!roomId) return;
        const cleaned =
            typeof note === 'string'
                ? note.replace(/\s+/g, ' ').trim().slice(0, 200)
                : '';
        roomPins.set(roomId, cleaned);
        io.to(roomId).emit(ACTIONS.ROOM_PIN_SYNC, { note: cleaned });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            const info = userSocketMap[socket.id];
            const label = info?.displayName ?? 'Someone';
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                displayName: label,
                username: label,
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
