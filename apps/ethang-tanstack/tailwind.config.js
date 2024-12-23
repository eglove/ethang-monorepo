// eslint-disable-next-line barrel/avoid-barrel-files
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/react-components/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  plugins: [animate],
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
      animation: {
        "accordion-down": "accordion-item-down 0.2s ease-out",
        "accordion-up": "accordion-item-up 0.2s ease-out",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        sidebar: {
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-item-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-item-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      rotate: {
        135: "135deg",
      },
    },
  },
};

