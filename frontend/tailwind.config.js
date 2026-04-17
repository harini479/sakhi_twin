/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        'primary-light': '#e0f2fe',
        'success-green': '#22c55e',
        'success-light': '#dcfce7',
        'bg-page': '#f0f4f8',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        'border-color': '#e2e8f0', // Renamed to avoid collision with default border
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
