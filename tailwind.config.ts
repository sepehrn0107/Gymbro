import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'], // Stitch alias
        body: ['Manrope', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#111416',

        // Surface hierarchy — nested (legacy) + flat (Stitch) aliases
        surface: {
          DEFAULT: '#1d2022',
          raised: '#272a2c',
          high: '#323537',
          low: '#191c1e',
          bright: '#37393c',
          dim: '#111416',
          variant: '#323537',
        },
        'surface-container': '#1d2022',
        'surface-container-low': '#191c1e',
        'surface-container-high': '#272a2c',
        'surface-container-highest': '#323537',
        'surface-container-lowest': '#0c0f11',
        'surface-bright': '#37393c',

        // Primary — light mint per Stitch "Tactical Precision" design system
        primary: {
          DEFAULT: '#d7fff3',       // The signal color — light mint
          foreground: '#00382f',    // on-primary — dark text on primary bg
          container: '#00f5d4',     // primary-container — teal
          dim: '#00dfc1',           // primary-fixed-dim — teal for glows
          fixed: '#26fedc',
        },

        // Accent (tertiary green)
        accent: {
          DEFAULT: '#63f3ad',
          foreground: '#003822',
          dim: '#4cdf9b',
        },

        // Text tokens
        text: {
          primary: '#e1e2e5',
          secondary: '#b9cac4',
        },
        'on-surface': '#e1e2e5',
        'on-surface-variant': '#b9cac4',
        'on-primary': '#00382f',
        'on-background': '#e1e2e5',

        // Borders / outlines
        border: '#3a4a46',
        outline: {
          DEFAULT: '#83948f',
          variant: '#3a4a46',
        },
        'outline-variant': '#3a4a46',

        secondary: {
          DEFAULT: '#c6c6c9',
          container: '#454749',
          foreground: '#2f3133',
        },
        'on-secondary-container': '#b4b5b7',

        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'on-error': '#690005',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        ambient: '0 24px 48px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(215, 255, 243, 0.2)',
        'glow-teal': '0 0 20px rgba(0, 223, 193, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
