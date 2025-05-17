import typography from "@tailwindcss/typography";
import daisyui from "daisyui";
import { fontFamily } from "tailwindcss/defaultTheme.js";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  daisyui: {
    themes: ["night"],
  },
  plugins: [daisyui, typography],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Noto Sans Mono", ...fontFamily.mono],
        sans: ["Noto Sans", ...fontFamily.sans],
        serif: ["Noto Serif", ...fontFamily.serif],
      },
    },
  },
};
