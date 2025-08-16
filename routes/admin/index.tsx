import { define } from "../../utils.ts";
import AdminDashboard from "../../islands/AdminDashboard.tsx";

export default define.page(function Admin(ctx) {
  ctx.state.title = "Admin Panel - Lapor";

  // Check if user is logged in and is admin
  if (!ctx.state.user) {
    return new Response("", {
      status: 302,
      headers: { Location: "/auth/login" },
    });
  }

  if (!ctx.state.user.is_admin) {
    return new Response("Access Denied", { status: 403 });
  }

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p class="text-gray-600">
              Manage pollution reports and user accounts
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">
              Welcome, {ctx.state.user.name}
            </span>
            <form method="POST" action="/api/auth/logout">
              <button
                type="submit"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <div class="bg-white shadow rounded-lg mb-8">
          <div class="px-6 py-4">
            <nav class="flex space-x-8">
              <a
                href="/admin"
                class="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-blue-600 pb-2"
              >
                Reports Dashboard
              </a>
              <a
                href="/admin/users"
                class="text-gray-500 hover:text-gray-700 font-medium pb-2"
              >
                User Management
              </a>
              <a
                href="/admin/settings"
                class="text-gray-500 hover:text-gray-700 font-medium pb-2"
              >
                Settings
              </a>
            </nav>
          </div>
        </div>

        {/* Dashboard */}
        <AdminDashboard user={ctx.state.user} />
      </div>
    </div>
  );
});
