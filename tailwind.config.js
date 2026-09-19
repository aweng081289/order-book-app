/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",                  // Scans the main HTML file
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Scans all files in src/ (Vue, JS, etc.)
  ],
  theme: {
    extend: {
      // Your custom extensions here, e.g., colors for dark blue/violet gradients
      colors: {
        'dark-blue': '#1e3a8a',
        'violet': '#6d28d9',
      },
    },
  },
  plugins: [],
};