/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080C0B',
          surface: '#0F1512',
          card: '#141A19',
        },
        border: {
          DEFAULT: '#1E2A28',
          subtle: '#162220',
        },
        teal: {
          DEFAULT: '#00E5C3',
          dim: '#00C4AA',
          muted: '#00857A',
          glow: 'rgba(0, 229, 195, 0.08)',
        },
        text: {
          primary: '#E8EEEE',
          secondary: '#7A9A98',
          muted: '#4A6A68',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      letterSpacing: {
        badge: '0.08em',
      },
    },
  },
  plugins: [],
}

