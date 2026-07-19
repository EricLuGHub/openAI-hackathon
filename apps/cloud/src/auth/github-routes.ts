import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { GitHubAuthService } from "./github-auth.js";

export function createGitHubAuthRoutes(auth: GitHubAuthService) {
  const routes = new Hono();
  routes.get("/github/start", async (c) => {
    const state = await auth.start();
    setCookie(c, "haderach_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 600,
      path: "/auth/github",
    });
    return c.redirect(auth.authorizationUrl(state));
  });
  routes.get("/github/callback", async (c) => {
    const state = c.req.query("state");
    const code = c.req.query("code");
    if (!state || !code || getCookie(c, "haderach_oauth_state") !== state)
      return c.json({ error: "Invalid OAuth callback" }, 400);
    const session = await auth.callback(code, state);
    deleteCookie(c, "haderach_oauth_state", { path: "/auth/github" });
    setCookie(c, "haderach_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return c.redirect(process.env.WEB_APP_URL ?? "http://127.0.0.1:3000");
  });
  return routes;
}
