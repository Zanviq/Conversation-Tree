import { and, desc, eq, inArray } from 'drizzle-orm';
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { db } from '../db/client.js';
import { conversations, messages, userSettings } from '../db/schema.js';

// Access rules enforced here (the project never used database RLS; every query is scoped in code):
// - conversations: a user can list/read/create/update/delete only rows where user_id = current user
// - messages: readable/writable only through a conversation owned by the current user
// - user_settings: a user can read/update only the row where user_id = current user,
//   and active_conversation_id must point to one of the user's own conversations

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const isUuidOrNull = (v: unknown) => v === null || v === undefined || isUuid(v);
const isStringArray = (v: unknown) => v === undefined || v === null || (Array.isArray(v) && v.every((x) => typeof x === 'string'));

type MessageRow = typeof messages.$inferSelect;
type ConversationRow = typeof conversations.$inferSelect;

// DB rows -> frontend Session shape (see ../../types.ts). Null columns are omitted like optional fields.
const toMessage = (m: MessageRow) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  parentId: m.parentId,
  childrenIds: m.childrenIds,
  timestamp: m.timestamp,
  ...(m.attachments ? { attachments: m.attachments } : {}),
  ...(m.connections ? { connections: m.connections } : {}),
  ...(m.attachedTrackIds ? { attachedTrackIds: m.attachedTrackIds } : {}),
  ...(m.summary ? { summary: m.summary } : {}),
  ...(m.position ? { position: m.position } : {}),
});

const toSession = (c: ConversationRow, rows: MessageRow[]) => ({
  id: c.id,
  title: c.title,
  rootMessageId: c.rootMessageId,
  currentHeadId: c.currentHeadId,
  lastModified: c.lastModified,
  messageMap: Object.fromEntries(rows.map((m) => [m.id, toMessage(m)])),
});

const validateSession = (id: string, body: any): string | null => {
  if (!body || typeof body !== 'object') return 'Invalid body';
  if (body.id !== id) return 'Body id does not match URL';
  if (typeof body.title !== 'string') return 'title is required';
  if (!isUuidOrNull(body.rootMessageId) || !isUuidOrNull(body.currentHeadId)) return 'Invalid root/head id';
  if (typeof body.messageMap !== 'object' || body.messageMap === null) return 'messageMap is required';
  for (const [key, m] of Object.entries<any>(body.messageMap)) {
    if (!isUuid(key) || m?.id !== key) return `Invalid message id: ${key}`;
    if (m.role !== 'user' && m.role !== 'model') return `Invalid role on ${key}`;
    if (typeof m.content !== 'string') return `Invalid content on ${key}`;
    if (!isUuidOrNull(m.parentId)) return `Invalid parentId on ${key}`;
    if (!Array.isArray(m.childrenIds) || !isStringArray(m.childrenIds)) return `Invalid childrenIds on ${key}`;
    if (!isStringArray(m.connections) || !isStringArray(m.attachedTrackIds)) return `Invalid links on ${key}`;
  }
  return null;
};

const findOwned = (userId: string, id: string) =>
  db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });

conversationsRouter.get('/', async (req, res) => {
  const userId = req.user!.id;
  const convs = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));

  const ids = convs.map((c) => c.id);
  const rows = ids.length ? await db.select().from(messages).where(inArray(messages.conversationId, ids)) : [];

  const byConversation = new Map<string, MessageRow[]>();
  for (const m of rows) {
    const list = byConversation.get(m.conversationId) ?? [];
    list.push(m);
    byConversation.set(m.conversationId, list);
  }

  res.json({ sessions: convs.map((c) => toSession(c, byConversation.get(c.id) ?? [])) });
});

// Upsert a whole conversation. The client always holds the full tree, so messages are replaced in one transaction.
conversationsRouter.put('/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;
  if (!isUuid(id)) {
    res.status(400).json({ error: 'Invalid conversation id' });
    return;
  }
  const error = validateSession(id, req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const existing = await db.query.conversations.findFirst({ where: eq(conversations.id, id) });
  if (existing && existing.userId !== userId) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const body = req.body;
  await db.transaction(async (tx) => {
    const values = {
      title: body.title.slice(0, 500),
      rootMessageId: body.rootMessageId ?? null,
      currentHeadId: body.currentHeadId ?? null,
      lastModified: Number(body.lastModified) || Date.now(),
    };
    if (existing) {
      await tx.update(conversations).set(values).where(eq(conversations.id, id));
    } else {
      await tx.insert(conversations).values({ id, userId, ...values });
    }

    await tx.delete(messages).where(eq(messages.conversationId, id));
    const rows = Object.values<any>(body.messageMap).map((m) => ({
      id: m.id,
      conversationId: id,
      role: m.role,
      content: m.content,
      attachments: m.attachments ?? null,
      parentId: m.parentId ?? null,
      childrenIds: m.childrenIds,
      connections: m.connections ?? null,
      attachedTrackIds: m.attachedTrackIds ?? null,
      summary: m.summary ?? null,
      position: m.position ?? null,
      timestamp: Number(m.timestamp) || Date.now(),
    }));
    if (rows.length) await tx.insert(messages).values(rows);
  });

  res.status(existing ? 200 : 201).json({ ok: true });
});

conversationsRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;
  if (!isUuid(id) || !(await findOwned(userId, id))) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

const toSettings = (s?: typeof userSettings.$inferSelect) => ({
  activeConversationId: s?.activeConversationId ?? null,
  chatModel: s?.chatModel ?? null,
  labelModel: s?.labelModel ?? null,
});

settingsRouter.get('/', async (req, res) => {
  const row = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, req.user!.id) });
  res.json(toSettings(row));
});

settingsRouter.put('/', async (req, res) => {
  const userId = req.user!.id;
  const patch: Partial<typeof userSettings.$inferInsert> = {};
  const body = req.body ?? {};

  if ('activeConversationId' in body) {
    const active = body.activeConversationId;
    // Only allow pointing at the user's own conversation (or clearing it)
    if (active !== null && !(isUuid(active) && (await findOwned(userId, active)))) {
      res.status(400).json({ error: 'Unknown conversation' });
      return;
    }
    patch.activeConversationId = active;
  }
  for (const key of ['chatModel', 'labelModel'] as const) {
    if (key in body) {
      if (typeof body[key] !== 'string' || body[key].length > 100) {
        res.status(400).json({ error: `Invalid ${key}` });
        return;
      }
      patch[key] = body[key];
    }
  }

  const [row] = await db
    .insert(userSettings)
    .values({ userId, ...patch })
    .onConflictDoUpdate({ target: userSettings.userId, set: { ...patch, updatedAt: new Date() } })
    .returning();
  res.json(toSettings(row));
});
