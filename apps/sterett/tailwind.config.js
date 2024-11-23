import { nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/components/(button|date-picker|input|ripple|spinner|calendar|date-input|popover).js",
  ],
  plugins: [nextui()],
  theme: {
    extend: {},
  },
};

