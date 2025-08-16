import type { ComponentChildren } from "preact";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  class?: string;
}

export function Button({ class: className = "", ...props }: ButtonProps) {
  const baseClass =
    "px-2 py-1 border-gray-500 dark:border-gray-400 border-2 rounded-sm bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      {...props}
      class={`${baseClass} ${className}`.trim()}
    />
  );
}
