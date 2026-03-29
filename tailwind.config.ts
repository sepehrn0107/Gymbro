import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      colors: {
        // Dark OLED design system
        background: '#0A0A0A',
        surface: {
          DEFAULT: '#111111',
          raised: '#1C1C1C',
        },
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#F8FAFC',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#F8FAFC',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
        },
        border: '#1C1C1C',
      },
    },
  },
  plugins: [],
}

export default config
