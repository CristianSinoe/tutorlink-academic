/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uvBlue: "#18529D",
        uvGreen: "#28AD56",
        uvWhite: "#FFFFFF",
        uvBlack: "#000000",
      },
    },
  },
  plugins: [],
};
