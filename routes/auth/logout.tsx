import { define } from "../../utils.ts";
import LogoutComponent from "../../islands/LogoutComponent.tsx";

export default define.page(function Logout(ctx) {
  // Check if user is logged in
  const user = ctx.state.user || null;

  return <LogoutComponent user={user} />;
});
