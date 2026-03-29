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

const secondaryClasses = new Set([
  "bg-slate-700",
  "border-slate-500",
  "focus:ring-slate-400/30",
  "hover:bg-slate-600",
  "hover:border-slate-400",
  "text-slate-200",
]);

const tertiaryClasses = new Set([
  "bg-slate-800",
  "border-slate-600",
  "focus:ring-slate-400/30",
  "hover:bg-slate-700",
  "hover:border-slate-500",
  "text-slate-200",
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
  "focus:ring-slate-400/30",
  "hover:bg-slate-800",
  "hover:border-slate-500",
  "text-slate-100",
]);

const ghostClasses = new Set([
  "bg-transparent",
  "border-transparent",
  "focus:ring-slate-400/30",
  "hover:bg-slate-700",
  "hover:border-slate-500",
  "text-slate-200",
]);

const extraSmallClasses = new Set(["px-3", "py-1.5", "text-xs"]);
const smallClasses = new Set(["px-3", "py-2", "text-sm"]);
const largeClasses = new Set(["px-5", "py-3", "text-base"]);
const xLargeClasses = new Set(["px-6", "py-3.5", "text-base"]);

export const getButtonClasses = (
  variant: ButtonVariant,
  size: ButtonSize = "base",
) => {
  let classSet = new Set(baseClasses);

  switch (variant) {
    case "danger": {
      classSet = classSet.union(dangerClasses);
      break;
    }

    case "dark": {
      classSet = classSet.union(darkClasses);
      break;
    }

    case "default": {
      classSet = classSet.union(defaultClasses);
      break;
    }

    case "ghost": {
      classSet = classSet.union(ghostClasses);
      break;
    }

    case "secondary": {
      classSet = classSet.union(secondaryClasses);
      break;
    }

    case "success": {
      classSet = classSet.union(successClasses);
      break;
    }

    case "tertiary": {
      classSet = classSet.union(tertiaryClasses);
      break;
    }

    case "warning": {
      classSet = classSet.union(warningClasses);
      break;
    }
  }

  switch (size) {
    case "base": {
      break;
    }

    case "lg": {
      classSet = classSet.union(largeClasses);
      classSet.delete("leading-5");
      break;
    }

    case "sm": {
      classSet = classSet.union(smallClasses);
      break;
    }

    case "xl": {
      classSet = classSet.union(xLargeClasses);
      classSet.delete("leading-5");
      break;
    }

    case "xs": {
      classSet = classSet.union(extraSmallClasses);
      break;
    }
  }

  return [...classSet];
};
