/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf7',
          100: '#f9f6ed',
          200: '#f1e8d1',
          300: '#e5d3ab',
          400: '#d7ba7e',
          500: '#c59f55',
          600: '#a78140',
          700: '#846234',
        },
        champagne: '#F7E7CE',
        rosegold: '#B76E79',
        charcoal: {
          800: '#1A1817',
          900: '#121110',
          950: '#0A0908',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
