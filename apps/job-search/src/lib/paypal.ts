import type { PayPalButtonStyle } from "@paypal/paypal-js/types/components/buttons";

// eslint-disable-next-line cspell/spellchecker
export const paypalPlanId = "P-39J68719TF222364DM7EHNPQ";

export const paypalClientId =
  // eslint-disable-next-line cspell/spellchecker
  "AQfGJgvBSndwNYzxhX9IiWtgRuauRnmsAMn7I-xVtKhFOqmApfWNTwgtNfB3oOth9VZaghtkfkGxEN6-";

export const paypalProviderOptions = {
  clientId: paypalClientId,
  dataJsSdkLibrary: "button-factory",
  intent: "subscription",
  vault: true,
} as const;

export const getPayPalButtonStyles = (
  resolvedTheme: string | undefined,
): PayPalButtonStyle => {
  return {
    borderRadius: 0,
    color: "dark" === resolvedTheme ? "black" : "blue",
    disableMaxWidth: true,
    label: "subscribe",
    layout: "horizontal",
    shape: "rect",
  } as const;
};
