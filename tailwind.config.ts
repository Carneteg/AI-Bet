import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C63FF",
          dark: "#4B44CC",
        },
        surface: {
          DEFAULT: "#1A1A2E",
          card: "#16213E",
          hover: "#0F3460",
        },
        accent: {
          green: "#00C896",
          yellow: "#FFD166",
          red: "#EF476F",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
