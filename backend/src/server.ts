import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { registerPickupSocket } from "./sockets/pickup.socket";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.SOCKET_CORS_ORIGIN },
});

registerPickupSocket(io);

server.listen(PORT, () => {
  console.log(`EcoNexus backend listening on port ${PORT}`);
});
