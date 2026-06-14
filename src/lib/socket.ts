'use client';
import { io, Socket } from 'socket.io-client';
import { resolveClientThemeKey } from '@/themes';

let socket: Socket | null = null;

// Single-origin connection — the Socket.io server lives on the same host/port
// as the Next.js app (see server.js), so we connect with no URL. We pass the
// active game key so the server joins us to that title's round loop (the host
// alone would also work, but this makes ?theme= previews behave correctly).
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 800,
      query: { game: resolveClientThemeKey() },
    });
  }
  return socket;
}
