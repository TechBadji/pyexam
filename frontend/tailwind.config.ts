import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Archivo", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Seal — the claret of a diploma ribbon. Primary brand across the app.
        brand: {
          50: "#fbf3f7",
          100: "#f7e4ee",
          200: "#efc7dc",
          300: "#e09fc2",
          400: "#ca6e9f",
          500: "#af467e",
          600: "#8e2a63",
          700: "#741e51",
          800: "#5d1842",
          900: "#431131",
          950: "#27091c",
        },
        // Ink — plum-black neutrals for dark surfaces and body copy.
        ink: {
          50: "#f7f5f7",
          100: "#eeebef",
          200: "#dad5dd",
          300: "#b9b1bd",
          400: "#918697",
          500: "#736879",
          600: "#5d5462",
          700: "#4c4550",
          800: "#413b44",
          900: "#2b2530",
          950: "#1c1520",
        },
        // Foil — the "certified / passed" accent. Used sparingly.
        foil: {
          100: "#f8eed6",
          300: "#e2c179",
          500: "#c08a2e",
          700: "#8a6018",
        },
        // Certification tracks. One hue each, readable in both themes.
        track: {
          python: "#0f6e5c",
          "python-lite": "#34c6a8",
          c: "#2b4c9b",
          "c-lite": "#7fa3e8",
          algo: "#b4531a",
          "algo-lite": "#f0954f",
          psm1: "#6a3fa0",
          "psm1-lite": "#b48ce8",
        },
      },
      boxShadow: {
        seal: "0 1px 2px rgba(28,21,32,.06), 0 8px 24px -12px rgba(28,21,32,.28)",
        lift: "0 2px 4px rgba(28,21,32,.05), 0 24px 48px -24px rgba(28,21,32,.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(4%,-6%,0) scale(1.12)" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        rise: "rise .6s cubic-bezier(.2,.7,.3,1) both",
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite reverse",
        sweep: "sweep 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
