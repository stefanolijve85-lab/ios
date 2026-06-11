/**
 * Realtime layer: global chat + live "recent wins" / leaderboard pushes.
 * Authenticated via the same JWT the REST API uses (passed in the handshake).
 */
import type { Server, Socket } from 'socket.io';
import { verifyToken } from '../lib/auth.js';
import { getStore } from '../db/index.js';
import { bus } from '../lib/events.js';
import { randomSeed } from '../game/provablyFair.js';

interface SocketUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

// Simple per-user sliding-window rate limit for chat.
const CHAT_WINDOW_MS = 10_000;
const CHAT_MAX = 5;
const chatTimestamps = new Map<string, number[]>();

function sanitize(body: string): string {
  // Strip control chars / angle brackets to prevent any markup injection.
  return body.replace(/[<>]/g, '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 240);
}

function allowedToChat(userId: string): boolean {
  const now = Date.now();
  const arr = (chatTimestamps.get(userId) ?? []).filter((t) => now - t < CHAT_WINDOW_MS);
  if (arr.length >= CHAT_MAX) {
    chatTimestamps.set(userId, arr);
    return false;
  }
  arr.push(now);
  chatTimestamps.set(userId, arr);
  return true;
}

let online = 0;

export function attachSockets(io: Server) {
  // Auth handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return next(new Error('unauthorized'));
    (socket.data as { user: SocketUser }).user = {
      id: payload.sub, username: payload.username, isAdmin: payload.isAdmin,
    };
    next();
  });

  // Push every finalized round to the global feed.
  bus.onRound((record) => {
    io.emit('round:result', {
      username: record.username,
      bet: record.bet,
      multiplier: record.multiplier,
      payout: record.payout,
      status: record.status,
      createdAt: record.createdAt,
    });
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket.data as { user: SocketUser }).user;
    online += 1;
    io.emit('presence', { online });

    // Send chat backlog on connect.
    const store = getStore();
    socket.emit('chat:history', await store.recentChat(40));

    socket.on('chat:send', async (raw: { body?: string }) => {
      const dbUser = await store.getUserById(user.id);
      if (!dbUser) return;
      if (dbUser.isMuted && (dbUser.mutedUntil ?? 0) > Date.now()) {
        return socket.emit('chat:error', { error: 'You are muted' });
      }
      if (!allowedToChat(user.id)) {
        return socket.emit('chat:error', { error: 'You are sending messages too fast' });
      }
      const body = sanitize(String(raw?.body ?? ''));
      if (!body) return;
      const message = { id: randomSeed(6), userId: user.id, username: user.username, body, createdAt: Date.now() };
      await store.addChatMessage(message);
      io.emit('chat:message', message);
    });

    // Admin moderation: delete (mute) handled via REST; live mute broadcast here.
    socket.on('chat:mute', async (payload: { userId: string; minutes: number }) => {
      if (!user.isAdmin) return;
      const target = await store.getUserById(payload.userId);
      if (!target) return;
      const mutedUntil = payload.minutes > 0 ? Date.now() + payload.minutes * 60_000 : null;
      await store.updateUser(target.id, { isMuted: payload.minutes > 0, mutedUntil });
      io.emit('chat:system', { body: `${target.username} was muted by a moderator.` });
    });

    socket.on('disconnect', () => {
      online = Math.max(0, online - 1);
      io.emit('presence', { online });
    });
  });
}
