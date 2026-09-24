import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth.js';
import { db, pool } from './client.js';
import { conversations, messages, userSettings, users } from './schema.js';

// Demo data for local runs and screenshots. Inserted once, only when the demo user does not exist yet.
// AI answers below are pre-written so the app can be explored without a Gemini API key.

export const DEMO_USERNAME = 'demo';
export const DEMO_PASSWORD = 'demo1234';

interface Turn {
  key?: string;
  q: string;
  a: string;
  summary: string;
  children?: Turn[];
  // Keys of turns whose branch history is connected into this turn ("Connected Memory")
  connectFrom?: string[];
  // Keys of leaf turns attached as timelines for comparison (Track A, B, ...)
  tracks?: string[];
}

interface SeedConversation {
  title: string;
  headKey: string;
  root: Turn;
}

const SEED: SeedConversation[] = [
  {
    title: 'Which database should I use for my side project?',
    headKey: 'db-compare',
    root: {
      q: 'Which database should I use for my side project? It is a habit tracker web app with users, habits and daily check-ins.',
      summary: 'Pick a database',
      a: `For a habit tracker the data is small and very relational:

- **users** have many **habits**
- **habits** have many **check-ins** (one per day)

Two reasonable options:

1. **PostgreSQL** – relational, strong constraints, easy aggregate queries (streaks, weekly counts).
2. **MongoDB** – document model, flexible schema, quick to start if you store each habit with embedded check-ins.

If you tell me which direction you lean toward, I can sketch the schema.`,
      children: [
        {
          key: 'pg',
          q: "Let's go with PostgreSQL. What would the schema look like?",
          summary: 'PostgreSQL schema',
          a: `A minimal schema:

\`\`\`sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table check_ins (
  habit_id uuid not null references habits(id) on delete cascade,
  day date not null,
  primary key (habit_id, day)
);
\`\`\`

The composite primary key on \`check_ins\` prevents double check-ins on the same day without extra code.`,
          children: [
            {
              key: 'pg-streak',
              q: 'How do I calculate the current streak with SQL?',
              summary: 'Streak query',
              a: `Use the "gaps and islands" trick: consecutive days minus a row number give the same value.

\`\`\`sql
select count(*) as streak
from (
  select day, day - (row_number() over (order by day))::int as grp
  from check_ins
  where habit_id = $1
) t
group by grp
order by max(day) desc
limit 1;
\`\`\`

Check that \`max(day)\` is today or yesterday before showing it as the *current* streak.`,
            },
          ],
        },
        {
          key: 'db-compare',
          q: 'Compare the two approaches. Which one fits a solo developer better?',
          summary: 'Compare both',
          tracks: ['pg-streak', 'mongo-streak'],
          a: `Comparing the two timelines:

**Track A – PostgreSQL**
- Duplicate check-ins are blocked by the primary key
- The streak is a single SQL query
- Weekly totals are plain \`group by\` queries
- Schema changes need migrations

**Track B – MongoDB**
- Duplicate check-ins need \`$addToSet\`
- The streak is a loop in application code
- Reporting needs aggregation pipelines
- The schema can change without migrations

For a solo developer I would pick **PostgreSQL**: the data is relational, the constraints remove a class of bugs, and most hosting providers offer it for free at this scale.`,
        },
        {
          key: 'mongo',
          q: "Let's go with MongoDB. What would the documents look like?",
          summary: 'MongoDB documents',
          a: `One collection for users and one for habits, with check-ins embedded:

\`\`\`json
{
  "_id": "habit_123",
  "userId": "user_1",
  "name": "Read 20 pages",
  "checkIns": ["2026-09-20", "2026-09-21", "2026-09-22"]
}
\`\`\`

- Reading a habit with its history is a single query.
- The array grows by one entry per day, which stays small (a few KB per year).
- Use \`$addToSet\` when checking in so the same day is not stored twice.`,
          children: [
            {
              key: 'mongo-streak',
              q: 'How do I calculate the current streak here?',
              summary: 'Streak in Mongo',
              a: `The simplest approach is to compute it in application code after loading the habit:

\`\`\`ts
function currentStreak(days: string[]): number {
  const set = new Set(days);
  let streak = 0;
  const d = new Date();
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
\`\`\`

An aggregation pipeline can do the same, but for one user's habits the in-memory loop is easier to read and test.`,
            },
          ],
        },
      ],
    },
  },
  {
    title: 'Explain "The Prince" by Machiavelli',
    headKey: 'prince-leadership',
    root: {
      q: 'Explain "The Prince" by Machiavelli in a few paragraphs.',
      summary: 'The Prince overview',
      a: `*The Prince* (1513) is a short political treatise written by Niccolò Machiavelli and addressed to Lorenzo de' Medici.

It describes how a ruler can **acquire and keep power**, based on examples from ancient Rome and Italian city-states of the time. Instead of describing an ideal ruler, it focuses on what rulers actually do.

Key ideas:

- **Virtù** – the ability and energy to act decisively.
- **Fortuna** – luck and circumstances outside anyone's control.
- It is safer to be **feared than loved**, if one cannot be both – but a ruler must avoid being hated.`,
      children: [
        {
          key: 'prince-feared',
          q: 'Why does he say it is better to be feared than loved?',
          summary: 'Feared vs loved',
          a: `His argument (Chapter 17) is about reliability:

1. Love depends on the people's feelings, which change when their interests change.
2. Fear depends on the ruler, because it is backed by the certainty of punishment.

He adds a condition: the ruler must **avoid hatred**, mainly by not taking citizens' property or women. Fear without hatred keeps the state stable; hatred leads to conspiracies.`,
          children: [
            {
              key: 'prince-leadership',
              q: 'Does this idea still apply to modern leadership?',
              summary: 'Modern leadership',
              connectFrom: ['prince-context'],
              a: `Partly. Taking the historical context into account – Machiavelli wrote after losing his post in a violent change of regime – his advice is about survival in unstable conditions.

In modern organizations:

- **Predictability** still matters: clear rules and consistent consequences build trust, similar to his "certainty of punishment".
- **Fear** as a primary tool usually backfires: people leave, hide problems, and stop taking initiative.
- His warning about **hatred** maps well to fairness – leaders lose authority fastest when decisions look self-serving.

So the useful part today is less "be feared" and more "be consistent and never be seen as unfair".`,
            },
          ],
        },
        {
          key: 'prince-context',
          q: 'What was happening in Florence when he wrote it?',
          summary: 'Historical context',
          a: `In 1512 the Florentine Republic, which Machiavelli served as a diplomat, collapsed and the **Medici** family returned to power.

- Machiavelli lost his position.
- In 1513 he was accused of conspiracy, imprisoned and tortured, then released.
- He retired to his farm near San Casciano and wrote *The Prince* there.

Many historians read the book partly as an attempt to regain favor with the Medici.`,
        },
      ],
    },
  },
  {
    title: 'Plan a 3-day trip to Kyoto',
    headKey: 'kyoto-food',
    root: {
      q: 'Plan a 3-day trip to Kyoto for the first week of November.',
      summary: 'Kyoto 3-day trip',
      a: `Early November is the start of autumn foliage season, so popular spots get crowded after 9 AM.

**Day 1 – East Kyoto**
- Kiyomizu-dera (go early)
- Sannenzaka and Ninenzaka streets
- Gion in the evening

**Day 2 – Arashiyama**
- Bamboo grove at opening time
- Tenryu-ji garden
- Togetsukyo bridge

**Day 3 – North and Central**
- Kinkaku-ji
- Nishiki Market for lunch
- Fushimi Inari in the late afternoon`,
      children: [
        {
          key: 'kyoto-temples',
          q: 'Make it more focused on temples and gardens.',
          summary: 'Temples focus',
          a: `Temple-focused version:

- **Day 1:** Nanzen-ji → Philosopher's Path → Ginkaku-ji
- **Day 2:** Tenryu-ji → Okochi Sanso villa → Adashino Nenbutsu-ji
- **Day 3:** Ryoan-ji rock garden → Kinkaku-ji → Tofuku-ji (famous for autumn leaves)

Tofuku-ji's Tsutenkyo bridge is one of the busiest foliage spots in November, so arrive at opening.`,
        },
        {
          key: 'kyoto-food',
          q: 'Make it more focused on food instead.',
          summary: 'Food focus',
          a: `Food-focused version:

- **Day 1:** Nishiki Market tasting walk, then yudofu (simmered tofu) near Nanzen-ji
- **Day 2:** Matcha sweets in Uji, back to Pontocho for kaiseki dinner
- **Day 3:** Breakfast at a Kyoto-style obanzai restaurant, sake tasting in Fushimi

Kaiseki restaurants in Pontocho usually need a reservation a few weeks ahead in November.`,
        },
      ],
    },
  },
  {
    title: 'Weekly meal prep for two',
    headKey: 'meal-shopping',
    root: {
      q: 'Suggest a simple weekly meal prep plan for two people, mostly vegetarian.',
      summary: 'Meal prep plan',
      a: `Cook three bases on Sunday and combine them during the week:

1. **Roasted vegetables** – sweet potato, broccoli, chickpeas
2. **Grain** – a big pot of brown rice or quinoa
3. **Sauce** – tahini-lemon dressing and a simple tomato sauce

Mix and match: grain bowls on Mon/Wed, pasta with tomato sauce on Tue/Thu, and wraps on Friday.`,
      children: [
        {
          key: 'meal-shopping',
          q: 'Turn that into a shopping list.',
          summary: 'Shopping list',
          a: `**Produce**
- 3 sweet potatoes, 2 heads of broccoli, 2 lemons, 1 garlic bulb, spinach

**Pantry**
- 2 cans of chickpeas, 1 kg brown rice or quinoa, 500 g pasta, 2 cans of crushed tomatoes, tahini

**Other**
- Whole wheat wraps, feta cheese, eggs`,
        },
      ],
    },
  },
];

const buildConversation = (conv: SeedConversation, userId: string, startTime: number) => {
  const conversationId = randomUUID();
  const rows: (typeof messages.$inferInsert)[] = [];
  const aiIdByKey = new Map<string, string>();
  const pending: { aiRow: typeof messages.$inferInsert; userRow: typeof messages.$inferInsert; turn: Turn }[] = [];
  let clock = startTime;

  // Same placement rule as calculateNewNodePosition in App.tsx: children sit 100px below the parent,
  // each new sibling to the right of the previous one (with a minimum gap so labels do not overlap)
  const visit = (turn: Turn, parentAiId: string | null, position: { x: number; y: number }): string => {
    const userId_ = randomUUID();
    const aiId = randomUUID();
    clock += 90_000;
    const userRow: typeof messages.$inferInsert = {
      id: userId_,
      conversationId,
      role: 'user',
      content: turn.q,
      parentId: parentAiId,
      childrenIds: [aiId],
      summary: turn.summary,
      position,
      timestamp: clock,
    };
    const aiRow: typeof messages.$inferInsert = {
      id: aiId,
      conversationId,
      role: 'model',
      content: turn.a,
      parentId: userId_,
      childrenIds: [],
      position,
      timestamp: clock + 1,
    };
    rows.push(userRow, aiRow);
    if (turn.key) aiIdByKey.set(turn.key, aiId);
    pending.push({ aiRow, userRow, turn });
    let nextX = position.x;
    aiRow.childrenIds = (turn.children ?? []).map((child) => {
      const childId = visit(child, aiId, { x: nextX, y: position.y + 100 });
      nextX += Math.max(child.summary.length * 6.5, 90) + 40;
      return childId;
    });
    return userId_;
  };

  const rootUserId = visit(conv.root, null, { x: 0, y: 0 });

  // Resolve key references once every id is known
  for (const { aiRow, userRow, turn } of pending) {
    if (turn.connectFrom) aiRow.connections = turn.connectFrom.map((k) => aiIdByKey.get(k)!);
    if (turn.tracks) userRow.attachedTrackIds = turn.tracks.map((k) => aiIdByKey.get(k)!);
  }

  return {
    conversation: {
      id: conversationId,
      userId,
      title: conv.title,
      rootMessageId: rootUserId,
      currentHeadId: aiIdByKey.get(conv.headKey)!,
      lastModified: clock,
    },
    rows,
  };
};

export const seedDatabase = async () => {
  const existing = await db.query.users.findFirst({ where: eq(users.username, DEMO_USERNAME) });
  if (existing) return;

  await db.transaction(async (tx) => {
    const [demo] = await tx
      .insert(users)
      .values({ username: DEMO_USERNAME, displayName: 'Demo User', passwordHash: await hashPassword(DEMO_PASSWORD) })
      .returning();

    const now = Date.now();
    let firstId: string | null = null;
    // SEED[0] is the most recent conversation and appears first in the sidebar
    for (const [index, conv] of SEED.entries()) {
      const start = now - (index + 1) * 26 * 60 * 60 * 1000;
      const { conversation, rows } = buildConversation(conv, demo.id, start);
      await tx.insert(conversations).values({ ...conversation, createdAt: new Date(start) });
      await tx.insert(messages).values(rows);
      firstId ??= conversation.id;
    }

    await tx.insert(userSettings).values({
      userId: demo.id,
      activeConversationId: firstId,
      chatModel: 'gemini-3-flash-preview',
      labelModel: 'gemini-3-flash-preview',
    });
  });
  console.log(`Seeded demo account "${DEMO_USERNAME}"`);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
