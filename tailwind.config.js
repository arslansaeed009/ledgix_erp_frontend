/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './admin.html',
    './src/**/*.{js,jsx}',
    '../backend/src/admin/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A1120',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
        },
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          300: '#7FADE8',
          500: '#2E7BD6',
          600: '#1E63BD',
          700: '#1565C0',
          800: '#124F98',
          900: '#0D3A6F',
        },
        accent: {
          green: '#16A34A',
          greenLight: 'rgb(var(--accent-green-light) / <alpha-value>)',
          red: '#DC2626',
          redLight: 'rgb(var(--accent-red-light) / <alpha-value>)',
          amber: '#D97706',
          amberLight: 'rgb(var(--accent-amber-light) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          soft: 'rgb(var(--surface-soft) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
          border: 'rgb(var(--surface-border) / <alpha-value>)',
        }
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 26, 46, 0.04), 0 10px 28px -10px rgba(15, 26, 46, 0.12)',
        cardHover: '0 6px 12px rgba(15, 26, 46, 0.06), 0 20px 44px -14px rgba(15, 26, 46, 0.18)',
        glass: '0 8px 32px rgba(15, 26, 46, 0.08)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease-out both',
      }
    },
  },
  plugins: [],
}
