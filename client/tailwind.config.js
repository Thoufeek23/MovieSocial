/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      // Add this colors object
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
      },
    },
  },
  plugins: [],
}