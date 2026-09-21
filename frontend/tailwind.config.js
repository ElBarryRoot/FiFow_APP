/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fifow: {
          primary: '#5A35D6',
          primaryDark: '#4322B8',
          dark: '#101936',
          blue: '#2563EB',
          orange: '#F97316',
          green: '#059669',
          red: '#DC2626',
          yellow: '#FACC15',
          bg: '#F6F7FB',
          card: '#FFFFFF',
          text: '#111827',
          secondary: '#4B5563',
          muted: '#8B95A7',
          border: '#E3E6EE',
          lavender: '#F1EEFF',
          blueSoft: '#EEF6FF',
          mint: '#EAF8F3'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 48px rgba(16, 25, 54, 0.09)',
        card: '0 6px 20px rgba(16, 25, 54, 0.06)',
        float: '0 12px 30px rgba(90, 53, 214, 0.22)'
      }
    },
  },
  plugins: [],
}
