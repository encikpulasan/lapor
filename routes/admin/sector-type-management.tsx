import { define } from "../../utils.ts";
import SectorTypeManagement from "../../islands/SectorTypeManagement.tsx";

export default define.page(function AdminSectorTypeManagement(ctx) {
  ctx.state.title = "Sector & Type Management - Admin Panel";

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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Sector & Type Management
              </h1>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage pollution types and area sectors for the reporting system
              </p>
            </div>
            <div class="flex space-x-4">
              <a
                href="/admin"
                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              >
                ← Back to Dashboard
              </a>
              <form method="post" action="/api/auth/logout" class="inline">
                <button
                  type="submit"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <SectorTypeManagement />
      </div>
    </div>
  );
});
