import { define } from "../utils.ts";
import ReportForm from "../islands/ReportForm.tsx";
import ThemeToggle from "../islands/ThemeToggle.tsx";

export default define.page(function Home(ctx) {
  ctx.state.title = "Lapor - Neighbourhood Pollution Reporting";

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ThemeToggle />
      <div class="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pollution Reporting
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Report pollution issues in your area. Help keep our community clean
            and healthy.
          </p>

          {/* Dashboard Link */}
          <div class="mb-4">
            <a
              href="/dashboard"
              class="inline-flex items-center px-6 py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200 text-lg font-medium"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Public Dashboard
            </a>
          </div>
        </div>

        {/* User Status */}
        {ctx.state.user
          ? (
            <div class="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
              <div class="flex justify-between items-center">
                <p>
                  Welcome back, <strong>{ctx.state.user.name}</strong>!
                </p>
                <form method="POST" action="/api/auth/logout" class="ml-4">
                  <button
                    type="submit"
                    class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          )
          : (
            <div class="bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
              <p>
                You can report anonymously, or{" "}
                <a
                  href="/auth/login"
                  class="underline font-medium hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  sign in
                </a>{" "}
                to track your reports and get updates.
              </p>
            </div>
          )}

        {/* Report Form */}
        <ReportForm user={ctx.state.user} />

        {/* Footer */}
        <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>
              Reports are automatically forwarded to relevant authorities via
              SISPAA. Your privacy is protected and location data is used only
              for routing purposes.
            </p>
            <div class="mt-4 space-x-4">
              <a
                href="/about"
                class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                About
              </a>
              <a
                href="/privacy"
                class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/contact"
                class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Contact
              </a>
              {ctx.state.user?.is_admin && (
                <a
                  href="/admin"
                  class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Admin Panel
                </a>
              )}
              {ctx.state.user && (
                <form method="POST" action="/api/auth/logout" class="inline">
                  <button
                    type="submit"
                    class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline font-medium transition-colors"
                  >
                    Logout
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
