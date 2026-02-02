/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6eaf7',
          100: '#ccd5ef',
          200: '#99abdf',
          300: '#6681cf',
          400: '#3357bf',
          500: '#0129AC',  /* CloudFuze brand color */
          600: '#0124a0',
          700: '#011d84',
          800: '#011668',
          900: '#010f4c',
          950: '#000830',
        },
        accent: {
          50: '#e6eaf7',
          100: '#ccd5ef',
          200: '#99abdf',
          300: '#6681cf',
          400: '#3357bf',
          500: '#0129AC',
          600: '#0124a0',
          700: '#011d84',
          800: '#011668',
          900: '#010f4c',
          950: '#000830',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
