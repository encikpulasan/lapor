import { define } from "../utils.ts";

export default define.page(function App({ Component, state }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{state.title ?? "lapor"}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/tailwind-config.js"></script>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/theme.js"></script>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Component />
      </body>
    </html>
  );
});
