import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const SESSION_COOKIE = 'ct_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Stateless session: a signed JWT stored in an httpOnly cookie
export const setSessionCookie = (res: Response, user: AuthUser) => {
  const token = jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
};

export const readSession = (req: Request): AuthUser | null => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.username !== 'string') return null;
    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = readSession(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  req.user = user;
  next();
};
