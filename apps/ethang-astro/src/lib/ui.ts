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

export const pageClasses = "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8";

export const cardBase =
  "surface-card border border-night-owl-border bg-night-owl-surface";

export const cardTintBase =
  "surface-card surface-card-tint border border-night-owl-border bg-night-owl-surface/80 backdrop-blur-md";

export const headingBase = "font-semibold tracking-tight text-night-owl-fg";

export const inputBase =
  "w-full rounded-md border border-night-owl-border bg-night-owl-bg/80 px-3 py-2 text-night-owl-fg placeholder:text-night-owl-muted focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors outline-none";

export const labelBase =
  "text-xs font-bold tracking-[0.16em] text-night-owl-muted uppercase";

export const inlineLinkBase =
  "font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary";

export const blockquoteBase =
  "border-l-4 border-primary pl-4 my-4 italic text-night-owl-fg";

export const navLinkBase =
  "relative font-medium text-night-owl-fg transition-colors hover:text-primary";

export const navLinkClass = (isActive: boolean) => {
  return isActive
    ? "relative font-medium text-primary transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-primary"
    : navLinkBase;
};

export const underlineLinkBase =
  "font-medium text-night-owl-fg underline decoration-night-owl-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary";

export const mergeClass = (base: string, extra = "") => {
  return "" === extra ? base : `${base} ${extra}`;
};

export type ButtonSize = "md" | "sm" | "xs";

export type ButtonVariant =
  "danger" | "ghost" | "gradient" | "outline" | "primary";

const BUTTON_BASE = "cursor-pointer";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  danger:
    "bg-danger text-on-primary font-semibold transition-colors hover:bg-danger/80",
  ghost: "text-night-owl-muted hover:text-danger transition-colors",
  gradient:
    "bg-gradient-to-r from-primary to-accent text-on-primary font-semibold shadow-lg transition-all hover:brightness-110 active:scale-[0.98]",
  outline:
    "border border-night-owl-border bg-night-owl-surface/50 text-night-owl-fg hover:border-primary hover:text-primary transition-colors",
  primary:
    "bg-primary text-on-primary font-semibold shadow-sm transition-all hover:bg-secondary active:scale-[0.98]"
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: "px-4 py-2 rounded-md",
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
