// eslint-disable-next-line barrel/avoid-barrel-files
import { nextui } from "@nextui-org/react";
import tailwind from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../node_modules/@nextui-org/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/components/(accordion|avatar|button|image|link|modal|navbar|spinner|table|divider|ripple|checkbox|spacer).js",
  ],
  darkMode: ["class"],
  plugins: [nextui(), tailwind, animate],
  safelist: [
    {
      pattern: /^text-cyan-\d{3}$/u,
    },
    {
      pattern: /^text-teal-\d{3}$/u,
    },
    {
      pattern: /^text-green-\d{3}$/u,
    },
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
      rotate: {
        135: "135deg",
      },
    },
  },
};

