import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

export default function RegisterForm() {
  const name = useSignal("");
  const email = useSignal("");
  const password = useSignal("");
  const confirmPassword = useSignal("");
  const phone = useSignal("");
  const isSubmitting = useSignal(false);
  const error = useSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (isSubmitting.value) return;

    if (
      !name.value || !email.value || !password.value || !confirmPassword.value
    ) {
      error.value = "Please fill in all required fields";
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    isSubmitting.value = true;
    error.value = "";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          password: password.value,
          phone: phone.value || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to home page
        globalThis.location.href = "/";
      } else {
        error.value = result.error || "Registration failed";
      }
    } catch (err) {
      console.error("Registration error:", err);
      error.value = "Network error. Please try again.";
    } finally {
      isSubmitting.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error.value && (
        <div class="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded transition-colors">
          {error.value}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name *
        </label>
        <div class="mt-1">
          <input
            id="name"
            type="text"
            value={name.value}
            onInput={(e) => name.value = (e.target as HTMLInputElement).value}
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email address *
        </label>
        <div class="mt-1">
          <input
            id="email"
            type="email"
            value={email.value}
            onInput={(e) => email.value = (e.target as HTMLInputElement).value}
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Phone Number (Optional)
        </label>
        <div class="mt-1">
          <input
            id="phone"
            type="tel"
            value={phone.value}
            onInput={(e) => phone.value = (e.target as HTMLInputElement).value}
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password *
        </label>
        <div class="mt-1">
          <input
            id="password"
            type="password"
            value={password.value}
            onInput={(e) =>
              password.value = (e.target as HTMLInputElement).value}
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Must be at least 8 characters with uppercase, lowercase, and number
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password *
        </label>
        <div class="mt-1">
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword.value}
            onInput={(e) =>
              confirmPassword.value = (e.target as HTMLInputElement).value}
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          disabled={isSubmitting.value}
          class={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200 ${
            isSubmitting.value
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          }`}
        >
          {isSubmitting.value ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
