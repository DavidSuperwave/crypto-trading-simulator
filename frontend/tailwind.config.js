/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', 'sans-serif'],
      },
      colors: {
        // CFE Official Colors
        cfe: {
          primary: '#006400', // Dark Green
          secondary: '#32CD32', // Light Green
          accent: '#228B22', // Forest Green
          gold: '#D4AF37', // Gold accent
          white: '#FFFFFF',
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          }
        },
        // Government Theme Colors
        gov: {
          primary: '#1a4d2e',
          secondary: '#d4af37',
          accent: '#4ade80',
          dark: '#0f2e1c',
          light: '#2d5a3d',
        }
      },
      backgroundImage: {
        'cfe-gradient': 'linear-gradient(135deg, #006400 0%, #228B22 100%)',
        'gov-gradient': 'linear-gradient(135deg, #1a4d2e 0%, #2d5a3d 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
      },
      boxShadow: {
        'cfe': '0 4px 6px rgba(0, 100, 0, 0.1)',
        'gov': '0 4px 6px rgba(26, 77, 46, 0.1)',
      }
    },
  },
  plugins: [],
}

