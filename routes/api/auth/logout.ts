import { define } from "../../../utils.ts";
import { AuthService } from "../../../lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const sessionId = AuthService.getSessionFromCookies(ctx.req);

      if (sessionId) {
        await AuthService.logout(sessionId);
      }

      // Clear session cookie
      const clearCookie =
        "sessionId=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/";

      return new Response(
        JSON.stringify({
          success: true,
          message: "Logout successful",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": clearCookie,
          },
        },
      );
    } catch (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({ error: "Logout failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
