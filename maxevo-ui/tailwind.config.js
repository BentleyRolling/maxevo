/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'maxevo': {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#10b981',
        }
      },
      fontFamily: {
        'mono': ['Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace']
      }
    },
  },
  plugins: [],
}