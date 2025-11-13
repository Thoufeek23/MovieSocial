// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx}', // Look for JS/JSX files in app
    './components/**/*.{js,jsx}', // Look for JS/JSX files in components
  ],
  theme: {
    extend: {
      colors: {
        background: '#18181b', // zinc-900
        card: '#27272a', // zinc-800
        primary: '#10b981', // emerald-500
        foreground: '#fafafa', // zinc-50
      },
    },
  },
  plugins: [],
};