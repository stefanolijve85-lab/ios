import { io, type Socket } from 'socket.io-client';
import { getToken } from './api.js';
import { OFFLINE } from './offline.js';

let socket: Socket | null = null;

/** A no-op stand-in used in the offline demo build (no realtime server). */
function dummySocket(): Socket {
  const noop = () => dummy;
  const dummy = { on: noop, off: noop, emit: noop, connect: noop, disconnect: noop, connected: false } as unknown as Socket;
  return dummy;
}

export function getSocket(): Socket {
  if (OFFLINE) {
    if (!socket) socket = dummySocket();
    return socket;
  }
  if (!socket) {
    socket = io({ path: '/socket.io', auth: { token: getToken() }, autoConnect: true });
  }
  return socket;
}

export function reconnectSocket() {
  if (OFFLINE) return getSocket();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
}
