import { define } from "../../utils.ts";
import AdminSettings from "../../islands/AdminSettings.tsx";

export default define.page(function AdminSettingsPage(ctx) {
  ctx.state.title = "Settings - Admin Panel";

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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              System Settings
            </h1>
            <p class="text-gray-600 dark:text-gray-300">
              Configure system settings and preferences
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <a
              href="/admin"
              class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </a>
            <form method="POST" action="/api/auth/logout">
              <button
                type="submit"
                class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-8 transition-colors duration-200">
          <div class="px-6 py-4">
            <nav class="flex space-x-8">
              <a
                href="/admin"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium pb-2 transition-colors"
              >
                Reports Dashboard
              </a>
              <a
                href="/admin/users"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium pb-2 transition-colors"
              >
                User Management
              </a>
              <a
                href="/admin/settings"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium border-b-2 border-blue-600 dark:border-blue-400 pb-2 transition-colors"
              >
                Settings
              </a>
            </nav>
          </div>
        </div>

        {/* Settings */}
        <AdminSettings />
      </div>
    </div>
  );
});
