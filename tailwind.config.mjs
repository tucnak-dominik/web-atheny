/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF6F1',
        text: '#2C2418',
        'text-muted': '#5E5047',
        terracotta: '#C4956A',
        olive: '#556B2F',
        aegean: '#1E5B8A',
        day1: '#C4956A',
        day2: '#556B2F',
        day3: '#B8860B',
        day4: '#8B6F5E',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
