import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    // Redirect to logout API
    return new Response("", {
      status: 302,
      headers: { Location: "/api/auth/logout" },
    });
  },

  POST(_ctx) {
    // Redirect to logout API
    return new Response("", {
      status: 302,
      headers: { Location: "/api/auth/logout" },
    });
  },
});
