import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import type { User } from '../db/types.js';

export interface TokenPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
}

export function signToken(user: User): string {
  const payload: TokenPayload = { sub: user.id, username: user.username, isAdmin: user.isAdmin };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Public, balance-and-secret-safe view of a user for API responses. */
export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    balance: u.balance,
    isAdmin: u.isAdmin,
    clientSeed: u.clientSeed,
    nonce: u.nonce,
  };
}
