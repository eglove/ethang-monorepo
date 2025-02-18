// eslint-disable-next-line barrel/avoid-barrel-files
import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: {
              100: "#1e293b", // Slightly lighter for contrast
              200: "#334155", // For hover states
              300: "#475569", // For pressed states
              400: "#64748b", // For borders
              500: "#94a3b8", // For subtle text
              600: "#cbd5e1", // For secondary text
              700: "#e2e8f0", // For primary text
              800: "#f1f5f9", // For headings
              900: "#f8fafc", // For strong contrast text
              DEFAULT: "#0f172a", // Deep blue-black base
            },
            danger: {
              100: "#fee2e2",
              200: "#fecaca",
              300: "#fca5a5",
              400: "#f87171",
              50: "#fef2f2",
              500: "#ef4444",
              600: "#dc2626",
              700: "#b91c1c",
              800: "#991b1b",
              900: "#7f1d1d",
              DEFAULT: "#f87171",
              foreground: "#000000",
            },
            focus: "#4ade80",
            primary: {
              100: "#dcfce7",
              200: "#bbf7d0",
              300: "#86efac",
              400: "#4ade80",
              50: "#f0fdf4",
              500: "#22c55e",
              600: "#16a34a",
              700: "#15803d",
              800: "#166534",
              900: "#14532d",
              DEFAULT: "#4ade80",
              foreground: "#000000",
            },
            secondary: {
              100: "#f3e8ff",
              200: "#e9d5ff",
              300: "#d8b4fe",
              400: "#c084fc",
              50: "#faf5ff",
              500: "#a855f7",
              600: "#9333ea",
              700: "#7e22ce",
              800: "#6b21a8",
              900: "#581c87",
              DEFAULT: "#a855f7",
              foreground: "#000000",
            },
            success: {
              100: "#dcfce7",
              200: "#bbf7d0",
              300: "#86efac",
              400: "#4ade80",
              50: "#f0fdf4",
              500: "#22c55e",
              600: "#16a34a",
              700: "#15803d",
              800: "#166534",
              900: "#14532d",
              DEFAULT: "#4ade80",
              foreground: "#000000",
            },
            warning: {
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              50: "#fffbeb",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              DEFAULT: "#fbbf24",
              foreground: "#000000",
            },
          },
        },
        light: {
          colors: {
            background: {
              100: "#f1f5f9", // Slightly darker for contrast elements
              200: "#e2e8f0", // For hover states
              300: "#cbd5e1", // For pressed states
              400: "#94a3b8", // For borders
              500: "#64748b", // For subtle text
              600: "#475569", // For secondary text
              700: "#334155", // For primary text
              800: "#1e293b", // For headings
              900: "#0f172a", // For strong contrast text
              DEFAULT: "#f8fafc", // Soft white base
            },
            danger: {
              100: "#fee2e2",
              200: "#fecaca",
              300: "#fca5a5",
              400: "#f87171",
              50: "#fef2f2",
              500: "#ef4444",
              600: "#dc2626",
              700: "#b91c1c",
              800: "#991b1b",
              900: "#7f1d1d",
              DEFAULT: "#ef4444",
              foreground: "#ffffff",
            },
            focus: "#22c55e",
            primary: {
              100: "#dcfce7",
              200: "#bbf7d0",
              300: "#86efac",
              400: "#4ade80",
              50: "#f0fdf4",
              500: "#22c55e",
              600: "#16a34a",
              700: "#15803d",
              800: "#166534",
              900: "#14532d",
              DEFAULT: "#22c55e",
              foreground: "#ffffff",
            },
            secondary: {
              100: "#f3e8ff",
              200: "#e9d5ff",
              300: "#d8b4fe",
              400: "#c084fc",
              50: "#faf5ff",
              500: "#a855f7",
              600: "#9333ea",
              700: "#7e22ce",
              800: "#6b21a8",
              900: "#581c87",
              DEFAULT: "#9333ea",
              foreground: "#ffffff",
            },
            success: {
              100: "#dcfce7",
              200: "#bbf7d0",
              300: "#86efac",
              400: "#4ade80",
              50: "#f0fdf4",
              500: "#22c55e",
              600: "#16a34a",
              700: "#15803d",
              800: "#166534",
              900: "#14532d",
              DEFAULT: "#16a34a",
              foreground: "#ffffff",
            },
            warning: {
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              50: "#fffbeb",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              DEFAULT: "#d97706",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
  theme: {},
};
