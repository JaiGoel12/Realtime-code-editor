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

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, from, to, text, removed }) => {
        console.log('Received CODE_CHANGE from', socket.id, 'in room', roomId);
        // Broadcast incremental change to all other clients in the room
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {
            from,
            to,
            text,
            removed,
        });
        console.log('Broadcasted CODE_CHANGE to room', roomId);
    });

    socket.on(ACTIONS.CURSOR_POSITION, ({ roomId, cursor }) => {
        // Broadcast cursor position to all other clients in the room
        socket.in(roomId).emit(ACTIONS.CURSOR_UPDATE, {
            socketId: socket.id,
            cursor,
            username: userSocketMap[socket.id],
        });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        // Send full code to newly joined user
        io.to(socketId).emit(ACTIONS.SYNC_CODE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
