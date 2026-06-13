'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Single-origin connection — the Socket.io server lives on the same host/port
// as the Next.js app (see server.js), so we connect with no URL.
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 800,
    });
  }
  return socket;
}
