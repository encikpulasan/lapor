import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function ThemeToggle() {
  const theme = useSignal("light");
  const isHydrated = useSignal(false);

  useEffect(() => {
    // Wait a bit for the DOM to be ready
    const initializeTheme = () => {
      // Get initial theme from DOM or localStorage
      const getCurrentTheme = () => {
        // First check if dark class is already applied to document
        if (document.documentElement.classList.contains("dark")) {
          return "dark";
        }

        // Then check localStorage
        if (
          typeof localStorage !== "undefined" && localStorage.getItem("theme")
        ) {
          return localStorage.getItem("theme");
        }

        // Finally check system preference
        return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      };

      const initialTheme = getCurrentTheme();
      theme.value = initialTheme || "light";
      isHydrated.value = true;

      // Listen for theme changes from other sources
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" && mutation.attributeName === "class"
          ) {
            const isDark = document.documentElement.classList.contains("dark");
            const newTheme = isDark ? "dark" : "light";
            if (newTheme !== theme.value) {
              theme.value = newTheme;
            }
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return observer;
    };

    // Try to initialize immediately
    let observer = initializeTheme();

    // If DOM isn't ready, wait for it
    if (!document.documentElement) {
      setTimeout(() => {
        observer = initializeTheme();
      }, 100);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("theme", newTheme);
      localStorage.setItem("manual-theme", "true"); // Mark as manually set
    }
  };

  const toggleTheme = () => {
    const newTheme = theme.value === "light" ? "dark" : "light";
    theme.value = newTheme;
    applyTheme(newTheme);
  };

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated.value) {
    return (
      <div class="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-300 animate-pulse">
        <div class="w-5 h-5"></div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
      title={`Switch to ${theme.value === "light" ? "dark" : "light"} mode`}
    >
      {theme.value === "light"
        ? (
          // Moon icon for dark mode
          <svg
            class="w-5 h-5 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )
        : (
          // Sun icon for light mode
          <svg
            class="w-5 h-5 text-yellow-500 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
    </button>
  );
}
