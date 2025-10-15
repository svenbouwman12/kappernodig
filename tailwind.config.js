/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        secondary: '#1A1A1A',
        background: '#FFFFFF',
        grayNeutral: '#F5F5F5',
        success: '#00C46A',
        warning: '#FFD000',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.06)'
      },
      transitionDuration: {
        200: '200ms',
        300: '300ms',
      }
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
    }
  },
  plugins: [],
}


