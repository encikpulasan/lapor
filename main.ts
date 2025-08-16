import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { AuthService } from "./lib/auth.ts";
import { ServerSetup } from "./lib/setup.ts";

export const app = new App<State>();

app.use(staticFiles());

// Logging middleware
const loggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});
app.use(loggerMiddleware);

// Authentication middleware
const authMiddleware = define.middleware(async (ctx) => {
  const sessionId = AuthService.getSessionFromCookies(ctx.req);

  if (sessionId) {
    const user = await AuthService.getUserFromSession(sessionId);
    ctx.state.user = user;
  }

  return ctx.next();
});
app.use(authMiddleware);

// Include file-system based routes here
app.fsRoutes();

// Initialize server setup (create admin account, etc.)
try {
  await ServerSetup.initialize();
} catch (error) {
  console.error("Failed to initialize server:", error);
  Deno.exit(1);
}
