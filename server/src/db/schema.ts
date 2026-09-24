import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Schema is derived from the frontend types in ../../types.ts (Session, Message).
// Conversations used to live in browser localStorage or a JSON file; they are now stored per user.

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  displayName: varchar('display_name', { length: 64 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per Session (frontend name). Ids are generated on the client with crypto.randomUUID().
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    rootMessageId: uuid('root_message_id'),
    currentHeadId: uuid('current_head_id'),
    // Epoch milliseconds, same unit as Session.lastModified
    lastModified: bigint('last_modified', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('conversations_user_id_idx').on(t.userId, t.createdAt)],
);

// One row per Message. The tree structure is kept in parent_id / children_ids exactly as in the client.
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').notNull(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 8 }).notNull(),
    content: text('content').notNull().default(''),
    attachments: jsonb('attachments').$type<{ mimeType: string; data: string }[]>(),
    parentId: uuid('parent_id'),
    childrenIds: text('children_ids').array().notNull().default(sql`'{}'::text[]`),
    connections: text('connections').array(),
    attachedTrackIds: text('attached_track_ids').array(),
    summary: text('summary'),
    position: jsonb('position').$type<{ x: number; y: number }>(),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.id] })],
);

// Replaces the per-browser keys cosmic_fork_active_id / cosmic_chat_model / cosmic_label_model.
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeConversationId: uuid('active_conversation_id'),
  chatModel: text('chat_model'),
  labelModel: text('label_model'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
