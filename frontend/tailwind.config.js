/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        dark: {
          bg: '#000000',
          surface: '#0c0c0c',
          card: '#111111',
          border: '#1e1e1e',
          hover: '#161616',
        },
      },
      width: {
        sidebar: '260px',
      },
      height: {
        header: '60px',
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.03)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        'dropdown': '0 4px 12px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
