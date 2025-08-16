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
    "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:dark:bg-gray-600";

  return (
    <button
      {...props}
      class={`${baseClass} ${className}`.trim()}
    />
  );
}
