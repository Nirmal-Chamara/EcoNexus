import { Server } from "socket.io";

// Placeholder so the server can start.
// The pickup/collector owner will replace this with the real implementation.
export function registerPickupSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
  });
}