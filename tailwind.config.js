/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0d0d0f',
          surface: '#131316',
          card: '#18181c',
          cardHover: '#1f1f24',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.05)',
          hover: '#222228',
          text: '#f4f4f5',
          muted: '#a1a1aa',
          subtle: '#71717a',
          faint: '#52525b',
        },
        champagne: {
          300: '#edd8b4',
          400: '#e2c99a',
          500: '#d4b483',
          600: '#c09b65',
        },
        zinc: {
          850: '#1b1b1f',
          900: '#131316',
          950: '#0d0d0f',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      }
    },
  },
  plugins: [],
}
