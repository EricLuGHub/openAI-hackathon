import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { AuthenticationError } from "./personal-tokens.js";
import type { LocalAuthService } from "./local-auth.js";

const credentialsSchema = z.object({
  password: z.string().min(10).max(200),
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export function createLocalAuthRoutes(auth: LocalAuthService) {
  const routes = new Hono();

  routes.post("/signup", async (c) => {
    try {
      const input = credentialsSchema
        .extend({ username: z.string(), email: z.string() })
        .parse(await c.req.json());
      const session = await auth.signup(input);
      setCookie(c, "haderach_session", session, cookieOptions);
      return c.json({ authenticated: true }, 201);
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        return c.json(
          { error: "Username or email is already registered" },
          409,
        );
      if (error instanceof z.ZodError)
        return c.json(
          { error: error.issues[0]?.message ?? "Invalid signup details" },
          400,
        );
      if (error instanceof SyntaxError)
        return c.json({ error: "Request body must be valid JSON" }, 400);
      if (error instanceof Error) return c.json({ error: error.message }, 400);
      throw error;
    }
  });

  routes.post("/signin", async (c) => {
    try {
      const input = credentialsSchema
        .extend({ identifier: z.string().min(1).max(320) })
        .parse(await c.req.json());
      const session = await auth.signin(input.identifier, input.password);
      setCookie(c, "haderach_session", session, cookieOptions);
      return c.json({ authenticated: true });
    } catch (error) {
      if (error instanceof AuthenticationError)
        return c.json({ error: "Invalid username/email or password" }, 401);
      if (error instanceof z.ZodError)
        return c.json(
          { error: error.issues[0]?.message ?? "Invalid sign-in details" },
          400,
        );
      if (error instanceof SyntaxError)
        return c.json({ error: "Request body must be valid JSON" }, 400);
      throw error;
    }
  });

  routes.post("/signout", async (c) => {
    await auth.signout(getCookie(c, "haderach_session"));
    deleteCookie(c, "haderach_session", { path: "/" });
    return c.json({ authenticated: false });
  });

  return routes;
}
