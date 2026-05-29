/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0b0f1a',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
      },
    },
  },
  plugins: [],
};
