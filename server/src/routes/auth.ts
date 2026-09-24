import { eq } from 'drizzle-orm';
import { Router } from 'express';
import {
  clearSessionCookie,
  hashPassword,
  readSession,
  setSessionCookie,
  verifyPassword,
} from '../auth.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

export const authRouter = Router();

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

const toPublicUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
});

authRouter.post('/register', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const displayName = String(req.body?.displayName ?? '').trim() || username;

  if (!USERNAME_PATTERN.test(username)) {
    res.status(400).json({ error: 'Username must be 3-32 characters (letters, numbers, _ . -).' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }
  if (displayName.length > 64) {
    res.status(400).json({ error: 'Display name must be at most 64 characters.' });
    return;
  }

  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (existing) {
    res.status(409).json({ error: 'Username is already taken.' });
    return;
  }

  const [created] = await db
    .insert(users)
    .values({ username, displayName, passwordHash: await hashPassword(password) })
    .returning();

  setSessionCookie(res, { id: created.id, username: created.username });
  res.status(201).json({ user: toPublicUser(created) });
});

authRouter.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  const user = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  setSessionCookie(res, { id: user.id, username: user.username });
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', async (req, res) => {
  const session = readSession(req);
  const user = session ? await db.query.users.findFirst({ where: eq(users.id, session.id) }) : undefined;
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: toPublicUser(user) });
});
