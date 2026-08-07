import { Hono } from "hono";
import { Client } from "pg";
import { authenticate } from "./middleware/authenticate";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  JWT_SECRET: string;
};

type Variables = {
  userId: number;
};

const habits = new Hono<{ Bindings: Bindings; Variables: Variables }>();

habits.use("/*", authenticate);

// JST の今日の日付を "YYYY-MM-DD" 形式で返す
function jstToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

// ストリーク日数を計算（Rails の Habit#streak と同じロジック）
function calcStreak(checkedDates: Set<string>, today: string): number {
  const shiftDay = (dateStr: string, n: number) => {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  let current = checkedDates.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (checkedDates.has(current)) {
    count++;
    current = shiftDay(current, -1);
  }
  return count;
}

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type CheckinRow = {
  checked_on: string; // "YYYY-MM-DD"
};

function serializeHabit(habit: HabitRow, checkins: CheckinRow[]) {
  const today = jstToday();
  const checkedDates = new Set(
    checkins.map((c) =>
      typeof c.checked_on === "string" ? c.checked_on.slice(0, 10) : c.checked_on.toISOString().slice(0, 10)
    )
  );
  return {
    ...habit,
    streak: calcStreak(checkedDates, today),
    checked_today: checkedDates.has(today),
  };
}

// GET /api/v1/habits
habits.get("/", async (c) => {
  const userId = c.get("userId");
  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const habitsResult = await client.query<HabitRow>(
      "SELECT * FROM habits WHERE user_id = $1 ORDER BY position ASC",
      [userId]
    );
    const habitRows = habitsResult.rows;

    if (habitRows.length === 0) {
      return c.json({ habits: [] });
    }

    const habitIds = habitRows.map((h) => h.id);
    const lookback = new Date();
    lookback.setDate(lookback.getDate() - 365);
    const lookbackStr = lookback.toISOString().slice(0, 10);

    const checkinsResult = await client.query<CheckinRow & { habit_id: string }>(
      `SELECT habit_id, checked_on::text AS checked_on FROM checkins
       WHERE habit_id = ANY($1) AND checked_on >= $2`,
      [habitIds, lookbackStr]
    );

    const checkinsByHabit = new Map<string, CheckinRow[]>();
    for (const row of checkinsResult.rows) {
      const list = checkinsByHabit.get(row.habit_id) ?? [];
      list.push({ checked_on: row.checked_on });
      checkinsByHabit.set(row.habit_id, list);
    }

    const serialized = habitRows.map((h) =>
      serializeHabit(h, checkinsByHabit.get(h.id) ?? [])
    );
    return c.json({ habits: serialized });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// POST /api/v1/habits
habits.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => null);
  const { name, emoji, position } = body?.habit ?? {};

  if (!name || name.length > 50) {
    return c.json({ errors: ["名前は1〜50文字で入力してください"] }, 422);
  }
  if (!emoji) {
    return c.json({ errors: ["絵文字は必須です"] }, 422);
  }

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    // position が指定されていない場合は末尾に追加
    let pos = position;
    if (pos == null) {
      const maxResult = await client.query<{ max: number | null }>(
        "SELECT MAX(position) as max FROM habits WHERE user_id = $1",
        [userId]
      );
      pos = (maxResult.rows[0].max ?? 0) + 1;
    }

    const result = await client.query<HabitRow>(
      `INSERT INTO habits (user_id, name, emoji, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [userId, name, emoji, pos]
    );
    const habit = serializeHabit(result.rows[0], []);
    return c.json({ habit }, 201);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// PATCH /api/v1/habits/:id
habits.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const habitId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const { name, emoji, position } = body?.habit ?? {};

  if (name !== undefined && (name.length === 0 || name.length > 50)) {
    return c.json({ errors: ["名前は1〜50文字で入力してください"] }, 422);
  }
  if (emoji !== undefined && emoji.length === 0) {
    return c.json({ errors: ["絵文字は必須です"] }, 422);
  }

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const existing = await client.query<HabitRow>(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (existing.rows.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    const current = existing.rows[0];
    const newName = name ?? current.name;
    const newEmoji = emoji ?? current.emoji;
    const newPos = position ?? current.position;

    const result = await client.query<HabitRow>(
      `UPDATE habits SET name = $1, emoji = $2, position = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [newName, newEmoji, newPos, habitId, userId]
    );
    const habit = serializeHabit(result.rows[0], []);
    return c.json({ habit });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// DELETE /api/v1/habits/:id
habits.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const habitId = c.req.param("id");

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const result = await client.query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (result.rowCount === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }
    return new Response(null, { status: 204 });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

export default habits;
