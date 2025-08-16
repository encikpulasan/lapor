import { define } from "../utils.ts";
import PublicDashboard from "../islands/PublicDashboard.tsx";

export default define.page(function Dashboard(ctx) {
  ctx.state.title = "Public Dashboard - Lapor";

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pollution Reports
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real-time insights into pollution reports across neighbourhoods.
          </p>
        </div>

        {/* Navigation */}
        <div class="flex justify-center mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 transition-colors duration-200">
            <div class="flex space-x-1">
              <a
                href="/"
                class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-colors"
              >
                Report Issue
              </a>
              <span class="px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                Dashboard
              </span>
              {ctx.state.user && (
                <>
                  {ctx.state.user.is_admin && (
                    <a
                      href="/admin"
                      class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-colors"
                    >
                      Admin Panel
                    </a>
                  )}
                  <form method="POST" action="/api/auth/logout" class="inline">
                    <button
                      type="submit"
                      class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-md transition-colors"
                    >
                      Logout
                    </button>
                  </form>
                </>
              )}
              {!ctx.state.user && (
                <a
                  href="/auth/login"
                  class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md transition-colors"
                >
                  Login
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <PublicDashboard />
      </div>
    </div>
  );
});
