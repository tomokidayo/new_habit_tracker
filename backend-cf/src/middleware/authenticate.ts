import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  JWT_SECRET: string;
};

type Variables = {
  userId: number;
};

export const authenticate = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "認証が必要です" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(c.env.JWT_SECRET)
    );
    c.set("userId", Number(payload.sub));
  } catch {
    return c.json({ error: "トークンが無効です" }, 401);
  }

  await next();
});
