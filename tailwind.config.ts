import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        accent: ['"Bebas Neue"', 'cursive'],
      },
      colors: {
        cuban: {
          blue: '#0f3b9e',
          red: '#cc102d',
          white: '#ffffff',
          navy: '#0b2e7d',
          maroon: '#a40f25',
        }
      }
    }
  },
  plugins: []
} satisfies Config;
