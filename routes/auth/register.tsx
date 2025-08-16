import { define } from "../../utils.ts";
import RegisterForm from "../../islands/RegisterForm.tsx";

export default define.page(function Register(ctx) {
  ctx.state.title = "Register - Lapor";

  // Redirect if already logged in
  if (ctx.state.user) {
    return new Response("", {
      status: 302,
      headers: { Location: "/" },
    });
  }

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Or{" "}
            <a
              href="/auth/login"
              class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              sign in to existing account
            </a>
          </p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-200">
          <RegisterForm />

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div class="mt-6">
              <a
                href="/"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-blue-600 dark:bg-blue-500 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Continue without account (Anonymous reporting)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
