import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env';

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: false },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(env.PORT, () => {
  console.log(`[EcoNexus Backend] Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
