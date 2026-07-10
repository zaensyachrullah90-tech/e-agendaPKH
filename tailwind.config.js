/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          obsidian: "#05050a",
          purple: "#8b5cf6",
          gold: "#d97706",
          orange: "#f97316",
          glassWhite: "rgba(255, 255, 255, 0.85)"
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}