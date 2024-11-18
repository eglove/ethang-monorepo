import { nextui } from "@nextui-org/react";
import tailwind from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "../../node_modules/@nextui-org/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/components/(avatar|badge|button|dropdown|input|link|navbar|spinner|ripple|menu|popover).js"
  ],
  darkMode: "class",
  plugins: [nextui(), tailwind],
  theme: {
    extend: {},
  },
};

