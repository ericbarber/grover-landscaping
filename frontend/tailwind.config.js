/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#f6f2e8',
        paper: '#fffdf8',
        ink: '#17342d',
        forest: '#0f2f28',
        sand: '#dec79d',
        clay: '#bd6848',
        sky: '#dce8eb',
        slate: {
          50: '#f8f7f2',
          100: '#eef3ef',
          200: '#d8ddd7',
          300: '#b8c7c0',
          400: '#8ea795',
          500: '#6f8179',
          600: '#5d6e67',
          700: '#40584f',
          800: '#29443b',
          900: '#17342d',
          950: '#0f2f28',
        },
        emerald: {
          50: '#eef3ef',
          100: '#dce6de',
          200: '#c5d6cb',
          300: '#a6bead',
          400: '#8ea795',
          500: '#467a68',
          600: '#2d6654',
          700: '#24594a',
          800: '#173f35',
          900: '#14372f',
          950: '#0f2f28',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'serif'],
      },
      boxShadow: {
        'grover-sm': '0 8px 24px rgb(15 47 40 / 8%)',
        'grover-md': '0 20px 52px rgb(15 47 40 / 14%)',
        'grover-lg': '0 30px 70px rgb(15 47 40 / 20%)',
      },
    },
  },
  plugins: [],
};
