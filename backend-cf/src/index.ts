import { Hono } from "hono";
import { cors } from "hono/cors";
import { Client } from "pg";
import auth from "./auth";
import habits from "./habits";
import checkins from "./checkins";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  JWT_SECRET: string;
};

type Variables = {
  userId: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "/*",
  cors({
    origin: [
      "https://new-habit-tracker.toblue0905.workers.dev",
      "http://localhost:5173",
    ],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Authorization"],
    maxAge: 86400,
  })
);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/auth", auth);
app.route("/api/v1/habits", habits);
app.route("/api/v1/habits/:habit_id/checkins", checkins);

// DB接続の動作確認用エンドポイント
// Hyperdrive経由でPostgresに接続し、現在時刻を取得するだけのシンプルなテスト
app.get("/db-test", async (c) => {
  const client = new Client({
    connectionString: c.env.HYPERDRIVE.connectionString,
  });

  try {
    await client.connect();
    const result = await client.query("SELECT NOW() as now");
    return c.json({ connected: true, now: result.rows[0].now });
  } catch (err) {
    return c.json({ connected: false, error: String(err) }, 500);
  } finally {
    // Workersはリクエスト終了後にすぐ処理を止めてしまうことがあるため、
    // ctx.waitUntil でコネクションのクローズ処理を確実に待つ
    c.executionCtx.waitUntil(client.end());
  }
});

export default app;