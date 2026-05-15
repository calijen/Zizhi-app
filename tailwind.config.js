/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Alfa Slab One", "serif"],
        serif: ["Gentium Book Plus", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        primary: "#a0522d",
        background: "#fdf6e3",
        surface: "#f5efdc",
        "primary-text": "#1a110a",
        "secondary-text": "#3a2a1a",
        "muted-text": "#5a4334",
        "border-color": "#c1b496",
      },
    },
  },
  plugins: [],
}
