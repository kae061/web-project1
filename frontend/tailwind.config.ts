import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#f5f5f5',
        sidebar: '#ffffff',
        card: '#ffffff',
        foreground: '#1a1a1a',
        primary: {
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
          light: '#8b5cf6'
        },
        secondary: {
          text: '#6b7280'
        },
        message: {
          own: '#7c3aed',
          other: '#f3f4f6'
        },
        input: {
          bg: '#f3f4f6'
        },
        online: '#10b981',
        zinc: {
          950: '#09090b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-online': 'pulseOnline 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseOnline: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.7', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
