// eslint-disable-next-line barrel/avoid-barrel-files
import { nextui } from "@nextui-org/react";
import tailwind from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../node_modules/@nextui-org/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [nextui(), tailwind],
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
      rotate: {
        135: "135deg",
      },
    },
  },
};

