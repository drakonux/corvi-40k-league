/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a84c',
          dark: '#9a7a2e',
          light: '#e8c96e',
        },
        crimson: {
          DEFAULT: '#8b0000',
          dark: '#5a0000',
          light: '#b00000',
        },
        wh: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#6b6b6b',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #9a7a2e 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0a 0%, #141414 100%)',
      },
    },
  },
  plugins: [],
}
