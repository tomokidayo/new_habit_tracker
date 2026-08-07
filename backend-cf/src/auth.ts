import { Hono } from "hono";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// JWTを発行する共通処理（signup/loginで共通利用）
async function issueToken(userId: number, secret: string) {
  return await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Railsのdevise-jwt設定(1日)に合わせる
    .sign(new TextEncoder().encode(secret));
}

// POST /auth/signup … 新規登録
auth.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { name, email, password, password_confirmation } = body?.user ?? {};

  if (!email || !password) {
    return c.json({ errors: ["メールアドレスとパスワードは必須です"] }, 422);
  }
  if (password !== password_confirmation) {
    return c.json({ errors: ["パスワード（確認）が一致しません"] }, 422);
  }
  if (password.length < 6) {
    // Railsのconfig.password_length = 6..128 に合わせる
    return c.json({ errors: ["パスワードは6文字以上で入力してください"] }, 422);
  }

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return c.json({ errors: ["このメールアドレスは既に使用されています"] }, 422);
    }

    // Devise標準のbcryptハッシュと同じ形式で保存されるので、
    // 既存のRails側の検証ロジックとも互換性がある
    const encryptedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (name, email, encrypted_password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, email`,
      [name ?? null, email, encryptedPassword]
    );
    const user = result.rows[0];

    const token = await issueToken(user.id, c.env.JWT_SECRET);
    c.header("Authorization", `Bearer ${token}`);
    return c.json({ user }, 201);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

// POST /auth/login … ログイン
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { email, password } = body?.user ?? {};

  if (!email || !password) {
    return c.json({ error: "メールアドレスとパスワードを入力してください" }, 401);
  }

  const client = new Client({ connectionString: c.env.HYPERDRIVE.connectionString });
  await client.connect();

  try {
    const result = await client.query(
      "SELECT id, name, email, encrypted_password FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    // ユーザーが存在しない場合とパスワード不一致の場合を同じメッセージにする
    // （メールアドレスの存在有無を外部に漏らさないための一般的なセキュリティ対策）
    if (!user || !(await bcrypt.compare(password, user.encrypted_password))) {
      return c.json({ error: "メールアドレスまたはパスワードが違います" }, 401);
    }

    const token = await issueToken(user.id, c.env.JWT_SECRET);
    c.header("Authorization", `Bearer ${token}`);
    return c.json({ user: { id: user.id, name: user.name, email: user.email } });
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

export default auth;