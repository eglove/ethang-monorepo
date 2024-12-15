/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
  theme: {
    extend: {
      animation: {
        "accordion-down": "accordion-item-down 0.2s ease-out",
        "accordion-up": "accordion-item-up 0.2s ease-out",
      },
    },
  },
};

