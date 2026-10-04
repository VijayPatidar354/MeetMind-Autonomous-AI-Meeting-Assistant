/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      },
      colors: {
        neo: {
          bg: '#fdfbf7', // Warm cream background
          yellow: '#fcd34d',
          pink: '#f472b6',
          green: '#4ade80',
          blue: '#60a5fa',
          purple: '#c084fc'
        }
      }
    },
  },
  plugins: [],
}
