import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0E4D52", dark: "#0A3A3E", accent: "#19B5A0", soft: "#D9F3EE" },
        ink: "#0C2B30",
      },
      fontFamily: { sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
