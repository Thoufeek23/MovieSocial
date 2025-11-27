/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Exact matches from your client/src/index.css
        background: '#09090b',        
        foreground: '#fafafa',        
        card: '#18181b',              
        
        // Your Primary Green
        primary: {
          DEFAULT: '#16a34a',         
          foreground: '#fafafa',      
        },
        
        // UI Utility Colors (Matching standard dark mode Zinc palette)
        muted: {
          DEFAULT: '#71717a', // Zinc-500 for subtitles
          foreground: '#a1a1aa'
        },
        border: '#27272a',    // Zinc-800 for subtle borders
        input: '#27272a',     // Input fields background
        danger: '#dc2626',    // Red-600 for errors/delete
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        bold: ['Inter_700Bold', 'System'],
      }
    },
  },
  plugins: [],
}