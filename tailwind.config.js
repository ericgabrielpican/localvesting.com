/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",       // Blue accent
        secondary: "#1e3a8a",
        success: "#10b981",       // Green accent
        warning: "#f59e0b",
        danger: "#ef4444",
        muted: "#f3f4f6",
        text: "#111827",
        subtext: "#6b7280",
        background: "#ffffff",
        surface: "#f9fafb",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  darkMode: false, // Force light mode
};
