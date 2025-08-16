import { useSignal } from "@preact/signals";
import type { User } from "../lib/db.ts";

interface LogoutComponentProps {
  user: User | null;
}

export default function LogoutComponent({ user }: LogoutComponentProps) {
  const isLoggingOut = useSignal(false);
  const logoutStatus = useSignal<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const errorMessage = useSignal("");

  const handleLogout = async () => {
    if (isLoggingOut.value) return;

    isLoggingOut.value = true;
    logoutStatus.value = "loading";

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        logoutStatus.value = "success";

        // Redirect to home page after a short delay
        setTimeout(() => {
          globalThis.location.href = "/";
        }, 1500);
      } else {
        throw new Error(result.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      logoutStatus.value = "error";
      errorMessage.value = error instanceof Error
        ? error.message
        : "Logout failed";

      // Reset error state after a delay
      setTimeout(() => {
        logoutStatus.value = "idle";
        errorMessage.value = "";
      }, 3000);
    } finally {
      isLoggingOut.value = false;
    }
  };

  const getButtonContent = () => {
    switch (logoutStatus.value) {
      case "loading":
        return (
          <>
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Logging out...
          </>
        );
      case "success":
        return "✓ Logout Successful";
      case "error":
        return "✗ Logout Failed";
      default:
        return "Logout Now";
    }
  };

  const getButtonClass = () => {
    const baseClass =
      "w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5";

    switch (logoutStatus.value) {
      case "loading":
        return `${baseClass} bg-blue-600 text-white cursor-not-allowed`;
      case "success":
        return `${baseClass} bg-green-600 text-white cursor-not-allowed`;
      case "error":
        return `${baseClass} bg-red-700 text-white cursor-not-allowed`;
      default:
        return `${baseClass} bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white`;
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        {/* Header */}
        <div class="text-center mb-8">
          <div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg
              class="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Logout
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            {user
              ? `Goodbye, ${user.name || user.email}!`
              : "You are about to logout"}
          </p>
        </div>

        {/* Logout Card */}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div class="text-center mb-6">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to logout? You'll need to log in again to
              access your account.
            </p>

            {user && (
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Current Session:
                </p>
                <p class="font-medium text-gray-900 dark:text-white">
                  {user.name || "Unknown User"}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            )}

            {/* Error Message */}
            {logoutStatus.value === "error" && (
              <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
                {errorMessage.value}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div class="space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut.value || logoutStatus.value === "success"}
              class={getButtonClass()}
            >
              {getButtonContent()}
            </button>

            <a
              href="/"
              class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center block"
            >
              Cancel & Go Home
            </a>
          </div>
        </div>

        {/* Footer */}
        <div class="text-center mt-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Need help?{" "}
            <a
              href="/admin"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
