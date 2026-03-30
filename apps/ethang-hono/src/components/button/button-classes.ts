export type ButtonSize = "base" | "lg" | "sm" | "xl" | "xs";

export type ButtonVariant =
  | "danger"
  | "dark"
  | "default"
  | "ghost"
  | "secondary"
  | "success"
  | "tertiary"
  | "warning";

const baseClasses = new Set([
  "border",
  "cursor-pointer",
  "focus:outline-none",
  "focus:ring-4",
  "font-medium",
  "leading-5",
  "px-4",
  "py-2.5",
  "rounded-lg",
  "text-sm",
  "transition-colors",
]);

const defaultClasses = new Set([
  "bg-sky-300/10",
  "border-sky-300/30",
  "focus:ring-sky-300/30",
  "hover:bg-sky-300/20",
  "hover:border-sky-300/50",
  "text-sky-300",
]);

const FOCUS_RING_SLATE_400 = "focus:ring-slate-400/30";
const TEXT_SLATE_200 = "text-slate-200";
const HOVER_BORDER_SLATE_500 = "hover:border-slate-500";

const secondaryClasses = new Set([
  "bg-slate-700",
  "border-slate-500",
  FOCUS_RING_SLATE_400,
  "hover:bg-slate-600",
  "hover:border-slate-400",
  TEXT_SLATE_200,
]);

const tertiaryClasses = new Set([
  "bg-slate-800",
  "border-slate-600",
  FOCUS_RING_SLATE_400,
  HOVER_BORDER_SLATE_500,
  "hover:bg-slate-700",
  TEXT_SLATE_200,
]);

const successClasses = new Set([
  "bg-green-400/10",
  "border-green-400/30",
  "focus:ring-green-400/30",
  "hover:bg-green-400/20",
  "hover:border-green-400/50",
  "text-green-400",
]);

const dangerClasses = new Set([
  "bg-red-400/10",
  "border-red-400/30",
  "focus:ring-red-400/30",
  "hover:bg-red-400/20",
  "hover:border-red-400/50",
  "text-red-400",
]);

const warningClasses = new Set([
  "bg-amber-400/10",
  "border-amber-400/30",
  "focus:ring-amber-400/30",
  "hover:bg-amber-400/20",
  "hover:border-amber-400/50",
  "text-amber-400",
]);

const darkClasses = new Set([
  "bg-slate-900",
  "border-slate-600",
  FOCUS_RING_SLATE_400,
  HOVER_BORDER_SLATE_500,
  "hover:bg-slate-800",
  "text-slate-100",
]);

const ghostClasses = new Set([
  "bg-transparent",
  "border-transparent",
  FOCUS_RING_SLATE_400,
  HOVER_BORDER_SLATE_500,
  "hover:bg-slate-700",
  TEXT_SLATE_200,
]);

const extraSmallClasses = new Set(["px-3", "py-1.5", "text-xs"]);
const smallClasses = new Set(["px-3", "py-2", "text-sm"]);
const largeClasses = new Set(["px-5", "py-3", "text-base"]);
const xLargeClasses = new Set(["px-6", "py-3.5", "text-base"]);

const VARIANT_CLASSES: Record<ButtonVariant, Set<string>> = {
  danger: dangerClasses,
  dark: darkClasses,
  default: defaultClasses,
  ghost: ghostClasses,
  secondary: secondaryClasses,
  success: successClasses,
  tertiary: tertiaryClasses,
  warning: warningClasses,
};

const SIZE_CLASSES: Record<ButtonSize, Set<string>> = {
  base: new Set(),
  lg: largeClasses,
  sm: smallClasses,
  xl: xLargeClasses,
  xs: extraSmallClasses,
};

const SIZES_WITHOUT_LEADING = new Set<ButtonSize>(["lg", "xl"]);

export const getButtonClasses = (
  variant: ButtonVariant,
  size: ButtonSize = "base",
) => {
  let classSet = new Set(baseClasses).union(VARIANT_CLASSES[variant]);
  classSet = classSet.union(SIZE_CLASSES[size]);

  if (SIZES_WITHOUT_LEADING.has(size)) {
    classSet.delete("leading-5");
  }

  return [...classSet];
};
