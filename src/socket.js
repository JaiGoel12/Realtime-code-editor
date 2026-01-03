import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    // Use environment variable or fallback to localhost for development
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    return io(backendUrl, options);
};
