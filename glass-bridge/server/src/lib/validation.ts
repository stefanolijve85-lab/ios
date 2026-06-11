import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'letters, numbers and _ only'),
  password: z.string().min(6).max(128),
  email: z.string().email().optional().or(z.literal('')),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const startRoundSchema = z.object({
  bet: z.number().positive(),
  clientSeed: z.string().max(128).optional(),
});

export const sideSchema = z.object({
  pick: z.enum(['LEFT', 'RIGHT']),
});

export const clientSeedSchema = z.object({
  clientSeed: z.string().min(1).max(128),
});

export const chatSchema = z.object({
  body: z.string().min(1).max(240),
});

export const configSchema = z.object({
  multipliers: z.array(z.number().positive()).min(1).max(50).optional(),
  houseEdge: z.number().min(0).max(0.5).optional(),
  minBet: z.number().positive().optional(),
  maxBet: z.number().positive().optional(),
  maxPayout: z.number().positive().optional(),
});
