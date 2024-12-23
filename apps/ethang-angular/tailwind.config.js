import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  daisyui: {
    themes: ["night"],
  },
  plugins: [daisyui, typography],
  theme: {
    extend: {},
  },
};

