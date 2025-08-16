import { define } from "../utils.ts";
import ReportForm from "../islands/ReportForm.tsx";

export default define.page(function Home(ctx) {
  ctx.state.title = "Lapor - Neighbourhood Pollution Reporting";

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Neighbourhood Pollution Reporting
          </h1>
          <p class="text-lg text-gray-600">
            Report pollution issues in your area. Help keep our community clean
            and healthy.
          </p>
        </div>

        {/* User Status */}
        {ctx.state.user
          ? (
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <div class="flex justify-between items-center">
                <p>
                  Welcome back,{" "}
                  <strong>{ctx.state.user.name}</strong>! Your reports will be
                  linked to your account for tracking.
                </p>
                <form method="POST" action="/api/auth/logout" class="ml-4">
                  <button
                    type="submit"
                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          )
          : (
            <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              <p>
                You can report anonymously, or{" "}
                <a href="/auth/login" class="underline font-medium">
                  sign in
                </a>{" "}
                to track your reports and get updates.
              </p>
            </div>
          )}

        {/* Report Form */}
        <ReportForm user={ctx.state.user} />

        {/* Footer */}
        <div class="mt-12 pt-8 border-t border-gray-200">
          <div class="text-center text-gray-500 text-sm">
            <p>
              Reports are automatically forwarded to relevant authorities via
              SISPAA. Your privacy is protected and location data is used only
              for routing purposes.
            </p>
            <div class="mt-4 space-x-4">
              <a href="/about" class="hover:text-gray-700">About</a>
              <a href="/privacy" class="hover:text-gray-700">Privacy Policy</a>
              <a href="/contact" class="hover:text-gray-700">Contact</a>
              {ctx.state.user?.is_admin && (
                <a href="/admin" class="hover:text-gray-700">Admin Panel</a>
              )}
              {ctx.state.user && (
                <form method="POST" action="/api/auth/logout" class="inline">
                  <button
                    type="submit"
                    class="text-red-600 hover:text-red-700 underline font-medium"
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
