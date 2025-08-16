import { define } from "../../../utils.ts";
import { AuthService } from "../../../lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = await ctx.req.json();
      const { email, password, name, phone } = body;

      // Validation
      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: "Email, password, and name are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!AuthService.isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const passwordValidation = AuthService.isValidPassword(password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ error: passwordValidation.error }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Register user
      const result = await AuthService.register(email, password, name, phone);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Auto-login after registration
      const loginResult = await AuthService.login(email, password);

      if (loginResult.success && loginResult.sessionId) {
        const sessionCookie = AuthService.createSessionCookie(
          loginResult.sessionId,
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: "Registration successful",
            user: {
              user_id: result.user!.user_id,
              email: result.user!.email,
              name: result.user!.name,
              is_admin: result.user!.is_admin,
            },
          }),
          {
            status: 201,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": sessionCookie,
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Registration successful",
          user: {
            user_id: result.user!.user_id,
            email: result.user!.email,
            name: result.user!.name,
            is_admin: result.user!.is_admin,
          },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Registration error:", error);
      return new Response(
        JSON.stringify({ error: "Registration failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
