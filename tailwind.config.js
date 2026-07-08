/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm neutral app identity (editor UI only — the resume paper stays white).
        canvas: {
          DEFAULT: '#f6f4ef',
          dark: '#1c1b1a',
        },
        ink: {
          DEFAULT: '#2b2926',
          soft: '#6b6862',
        },
        brandaccent: {
          DEFAULT: '#c2683b',
          soft: '#e8d5c7',
        },
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
