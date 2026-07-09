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
        ink:     "#0F1923", // fondo principal
        slate:   "#1A2A3A", // cards y superficies
        emerald: "#00C896", // ingresos / positivo
        amber:   "#F4B942", // alertas moderadas
        coral:   "#FF5C5C", // gastos / riesgo
        pearl:   "#E8EDF2", // texto principal
        muted:   "#6B7A8D", // texto secundario
        border:  "#243447", // bordes sutiles
      },
      borderRadius: {
        card: "12px",
        pill: "20px",
        tag:  "6px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
