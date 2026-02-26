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

const borderTransparent = "border-transparent";
const boxBorder = "box-border";
const textWhite = "text-white";
const focusRingNeutralTertiary = "focus:ring-neutral-tertiary";

const baseClasses = new Set([
  "border",
  "cursor-pointer",
  "focus:outline-none",
  "focus:ring-4",
  "font-medium",
  "leading-5",
  "px-4",
  "py-2.5",
  "rounded-base",
  "text-sm",
]);

const defaultClasses = new Set([
  "bg-brand",
  borderTransparent,
  boxBorder,
  "focus:ring-brand-medium",
  "hover:bg-brand-strong",
  "shadow-xs",
  textWhite,
]);

const secondaryClasses = new Set([
  "bg-neutral-secondary-medium",
  "border-default-medium",
  boxBorder,
  focusRingNeutralTertiary,
  "hover:bg-neutral-tertiary-medium",
  "hover:text-heading",
  "shadow-xs",
  "text-body",
]);

const tertiaryClasses = new Set([
  "bg-neutral-primary-soft",
  "border-default",
  "focus:ring-neutral-tertiary-soft",
  "hover:bg-neutral-secondary-medium",
  "hover:text-heading",
  "shadow-xs",
  "text-body",
]);

const successClasses = new Set([
  "bg-success",
  borderTransparent,
  boxBorder,
  "focus:ring-success-medium",
  "hover:bg-success-strong",
  "shadow-xs",
  textWhite,
]);

const dangerClasses = new Set([
  "bg-danger",
  borderTransparent,
  boxBorder,
  "focus:ring-danger-medium",
  "hover:bg-danger-strong",
  "shadow-xs",
  textWhite,
]);

const warningClasses = new Set([
  "bg-warning",
  borderTransparent,
  boxBorder,
  "focus:ring-warning-medium",
  "hover:bg-warning-strong",
  "shadow-xs",
  textWhite,
]);

const darkClasses = new Set([
  "bg-dark",
  borderTransparent,
  boxBorder,
  focusRingNeutralTertiary,
  "hover:bg-dark-strong",
  "shadow-xs",
  textWhite,
]);

const ghostClasses = new Set([
  "bg-transparent",
  borderTransparent,
  boxBorder,
  focusRingNeutralTertiary,
  "hover:bg-neutral-secondary-medium",
  "text-heading",
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
