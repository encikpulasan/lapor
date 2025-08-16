import { define } from "../../../utils.ts";
import { AuthService } from "../../../lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = await ctx.req.json();
      const { email, password } = body;

      // Validation
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Login user
      const result = await AuthService.login(email, password);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const sessionCookie = AuthService.createSessionCookie(result.sessionId!);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Login successful",
          user: {
            user_id: result.user!.user_id,
            email: result.user!.email,
            name: result.user!.name,
            is_admin: result.user!.is_admin,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": sessionCookie,
          },
        },
      );
    } catch (error) {
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({ error: "Login failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
