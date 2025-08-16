import { define } from "../../../utils.ts";
import { AuthService } from "../../../lib/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const sessionId = AuthService.getSessionFromCookies(ctx.req);

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "No session found" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const user = await AuthService.getUserFromSession(sessionId);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid session" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            user_id: user.user_id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            is_admin: user.is_admin,
            created_at: user.created_at,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Get user error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get user info" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
