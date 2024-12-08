import daisyUi from 'daisyui';
import prose from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [prose, daisyUi],
  daisyui: {
    themes: ['night', 'night', 'night']
  }
}

