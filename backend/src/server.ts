import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env';

import { registerPickupSocket } from './sockets';
import { startEmailWorker } from './services/email-worker.service';
import { pool } from './config/database';

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: false },
});

registerPickupSocket(io);

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

let stopEmailWorker: (() => Promise<void>) | undefined;
server.listen(env.PORT, () => {
  console.log(
    `[EcoNexus Backend] Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`
  );
  stopEmailWorker = startEmailWorker();
});
const shutdown = () => {
  void Promise.resolve(stopEmailWorker?.()).then(() => {
    io.close(() => {
      void pool.end();
    });
  });
};
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
