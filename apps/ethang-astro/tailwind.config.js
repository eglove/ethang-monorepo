// eslint-disable-next-line barrel/avoid-barrel-files
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  daisyui: {
    themes: ["night"],
  },
  plugins: [daisyui, typography],
  theme: {
    extend: {},
  },
};
