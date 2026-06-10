/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e4ef',
          500: '#2a5a8c',
          600: '#1e4a7a',
          700: '#163d66',
          800: '#0f2e50',
          900: '#0a1f38',
        },
        teal: {
          400: '#3db8cc',
          500: '#2a9db0',
          600: '#1e8a9a',
        },
        amber: {
          400: '#f5a623',
          500: '#e8960e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
