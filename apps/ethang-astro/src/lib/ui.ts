/*
 * Shared visual tokens for the Astro UI components.
 *
 * Every class string here is a complete Tailwind literal (never assembled
 * from fragments) so Tailwind v4's source scanner still emits each utility.
 * Consumers compose via mergeClass and never duplicate the base tokens.
 */

const CODE_LANGUAGES = new Set([
  "astro",
  "bash",
  "c",
  "css",
  "diff",
  "dockerfile",
  "go",
  "graphql",
  "haskell",
  "html",
  "ini",
  "java",
  "javascript",
  "js",
  "json",
  "jsonc",
  "jsx",
  "kotlin",
  "kt",
  "lua",
  "markdown",
  "md",
  "mdx",
  "php",
  "plaintext",
  "ps1",
  "py",
  "python",
  "rs",
  "ruby",
  "rust",
  "sass",
  "scss",
  "sh",
  "shell",
  "solidity",
  "sql",
  "swift",
  "toml",
  "ts",
  "tsx",
  "typescript",
  "vue",
  "xml",
  "yaml",
  "yml"
]);

export const sanitizeCodeLanguage = (language?: null | string) => {
  return !isNil(language) && CODE_LANGUAGES.has(language)
    ? language
    : "plaintext";
};

import isNil from "lodash/isNil.js";

export const pageClasses = "mx-auto max-w-7xl px-4 py-6";

export const cardBase =
  "border border-night-owl-border rounded-xl bg-night-owl-surface";

export const cardTintBase =
  "border border-night-owl-border rounded-xl bg-night-owl-surface/50 backdrop-blur-md";

export const headingBase = "font-semibold text-night-owl-fg";

export const inputBase =
  "rounded-lg border border-night-owl-border bg-night-owl-bg/80 px-3 py-2 text-night-owl-fg focus:border-primary transition-colors outline-none";

export const labelBase = "text-xs font-bold text-night-owl-muted uppercase";

export const inlineLinkBase = "text-primary hover:underline";

export const blockquoteBase =
  "border-l-4 border-primary pl-4 my-4 italic text-night-owl-fg";

export const navLinkBase =
  "text-night-owl-fg hover:text-primary transition-colors";

export const underlineLinkBase =
  "hover:text-primary hover:underline transition-colors";

export const mergeClass = (base: string, extra = "") => {
  return "" === extra ? base : `${base} ${extra}`;
};

export type ButtonSize = "md" | "sm" | "xs";

export type ButtonVariant =
  "danger" | "ghost" | "gradient" | "outline" | "primary";

const BUTTON_BASE = "cursor-pointer";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  danger:
    "bg-danger/20 hover:bg-danger/30 text-danger font-semibold transition-colors",
  ghost: "text-night-owl-muted hover:text-red-400 transition-colors",
  gradient:
    "bg-gradient-to-r from-primary to-accent text-on-primary font-semibold shadow-lg transition-all hover:opacity-90 active:scale-95",
  outline:
    "border border-night-owl-border text-night-owl-muted hover:text-primary transition-colors",
  primary:
    "bg-primary/20 hover:bg-primary/30 text-primary font-semibold transition-colors"
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: "px-4 py-2 rounded-lg",
  sm: "px-3 py-1.5 rounded-md text-sm",
  xs: "px-2 py-1 rounded-md text-xs"
};

export const buttonClasses = (variant: ButtonVariant, size: ButtonSize) => {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
};

export const paginationEdgeClass = (isDisabled: boolean) => {
  return isDisabled
    ? "px-3 py-1.5 rounded-md border border-night-owl-border text-night-owl-muted text-sm cursor-not-allowed opacity-50"
    : "px-3 py-1.5 rounded-md border border-night-owl-border text-night-owl-fg hover:text-primary hover:border-primary transition-colors text-sm";
};

export const paginationNumberClass = (isActive: boolean) => {
  return isActive
    ? "px-3 py-1.5 rounded-md border transition-colors text-sm bg-primary/20 border-primary text-primary font-semibold"
    : "px-3 py-1.5 rounded-md border transition-colors text-sm border-night-owl-border text-night-owl-fg hover:text-primary hover:border-primary";
};
