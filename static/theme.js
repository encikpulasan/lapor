// Auto-detect and apply system theme preference
(function () {
  // Check if user has a stored preference, otherwise use system preference
  const getThemePreference = () => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme");
    }
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Set initial theme
  const theme = getThemePreference();
  applyTheme(theme);

  // Store the preference
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("theme", theme);
  }

  // Listen for system theme changes
  const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");

  // Use modern addEventListener instead of deprecated addListener
  const handleSystemThemeChange = (e) => {
    // Only auto-switch if user hasn't manually set a preference
    if (
      typeof localStorage !== "undefined" &&
      !localStorage.getItem("manual-theme")
    ) {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    }
  };

  // Modern browsers support addEventListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemThemeChange);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
  }

  // Dispatch a custom event to notify components that theme has been initialized
  document.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(
      new CustomEvent("themeInitialized", {
        detail: { theme: theme },
      }),
    );

    // Also add a fallback theme toggle button in case the island doesn't work
    const fallbackToggle = document.createElement("button");
    fallbackToggle.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    `;
    fallbackToggle.className =
      "fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200";
    fallbackToggle.title = "Fallback Theme Toggle";

    fallbackToggle.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      localStorage.setItem("manual-theme", "true");

      // Update button icon
      if (newTheme === "dark") {
        fallbackToggle.innerHTML = `
          <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        `;
      } else {
        fallbackToggle.innerHTML = `
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        `;
      }
    });

    // Remove fallback after 3 seconds to avoid conflicts with the island
    setTimeout(() => {
      if (fallbackToggle.parentNode) {
        fallbackToggle.remove();
      }
    }, 3000);

    document.body.appendChild(fallbackToggle);
  });
})();
