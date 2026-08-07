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

const checkins = new Hono<{ Bindings: Bindings; Variables: Variables }>();

checkins.use("/*", authenticate);

function jstToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function shiftDay(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function calcStreak(checkedDates: Set<string>, today: string): number {
  let current = checkedDates.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (checkedDates.has(current)) {
    count++;
    current = shiftDay(current, -1);
  }
  return count;
}

// habit の所有者確認とストリーク計算に使う共通クエリ
async function getHabitAndStreak(
  client: Client,
  habitId: string,
  userId: number
): Promise<{ found: false } | { found: true; streak: number }> {
  const habitResult = await client.query(
    "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
    [habitId, userId]
  );
  if (habitResult.rows.length === 0) return { found: false };

  const today = jstToday();
  const lookback = shiftDay(today, -365);
  const checkinsResult = await client.query<{ checked_on: string }>(
    "SELECT checked_on FROM checkins WHERE habit_id = $1 AND checked_on >= $2",
    [habitId, lookback]
  );
  const checkedDates = new Set(
    checkinsResult.rows.map((r) => String(r.checked_on).slice(0, 10))
  );
  return { found: true, streak: calcStreak(checkedDates, today) };
}

// date 型カラムを "YYYY-MM-DD" 文字列に変換
// pg ドライバは date 型を JavaScript Date オブジェクトで返すため、
// SQL側で ::text キャストして文字列として受け取る
function toDateStr(val: unknown): string {
  if (typeof val === "string") return val.slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

// GET /api/v1/habits/:habit_id/checkins … 過去7日分
checkins.get("/", async (c) => {
  const userId = c.get("userId");
  const habitId = c.req.param("habit_id");
  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const habitResult = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (habitResult.rows.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    const today = jstToday();
    const weekStart = shiftDay(today, -6);

    const result = await client.query<{ id: string; habit_id: string; checked_on: string }>(
      `SELECT id, habit_id, checked_on::text AS checked_on FROM checkins
       WHERE habit_id = $1 AND checked_on >= $2 AND checked_on <= $3
       ORDER BY checked_on ASC`,
      [habitId, weekStart, today]
    );
    return c.json({ checkins: result.rows });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// POST /api/v1/habits/:habit_id/checkins … 今日チェックイン
checkins.post("/", async (c) => {
  const userId = c.get("userId");
  const habitId = c.req.param("habit_id");
  const today = jstToday();

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const habitResult = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (habitResult.rows.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    let checkin: { id: string; habit_id: string; checked_on: string };
    try {
      const result = await client.query<{ id: string; habit_id: string; checked_on: string }>(
        `INSERT INTO checkins (habit_id, checked_on, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id, habit_id, checked_on::text AS checked_on`,
        [habitId, today]
      );
      checkin = result.rows[0];
    } catch (err: any) {
      // unique_violation: habit_id + checked_on の重複
      if (err.code === "23505") {
        return c.json({ errors: ["今日は既にチェックイン済みです"] }, 422);
      }
      throw err;
    }

    const lookback = shiftDay(today, -365);
    const allCheckins = await client.query<{ checked_on: unknown }>(
      `SELECT checked_on::text AS checked_on FROM checkins
       WHERE habit_id = $1 AND checked_on >= $2`,
      [habitId, lookback]
    );
    const checkedDates = new Set(allCheckins.rows.map((r) => toDateStr(r.checked_on)));
    const streak = calcStreak(checkedDates, today);

    return c.json({ checkin, streak }, 201);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// DELETE /api/v1/habits/:habit_id/checkins/today … 今日のチェックイン取り消し
checkins.delete("/today", async (c) => {
  const userId = c.get("userId");
  const habitId = c.req.param("habit_id");
  const today = jstToday();

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const habitResult = await client.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, userId]
    );
    if (habitResult.rows.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    const del = await client.query(
      "DELETE FROM checkins WHERE habit_id = $1 AND checked_on = $2",
      [habitId, today]
    );
    if (del.rowCount === 0) {
      return c.json({ error: "No checkin found for today" }, 404);
    }

    const lookback = shiftDay(today, -365);
    // today は削除済みなので strictly before today でクエリし、キャッシュの影響を避ける
    const allCheckins = await client.query<{ checked_on: unknown }>(
      `SELECT checked_on::text AS checked_on FROM checkins
       WHERE habit_id = $1 AND checked_on >= $2 AND checked_on < $3`,
      [habitId, lookback, today]
    );
    const checkedDates = new Set(allCheckins.rows.map((r) => toDateStr(r.checked_on)));
    const streak = calcStreak(checkedDates, today);

    return c.json({ streak });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

export default checkins;
