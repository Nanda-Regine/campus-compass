import type { Config } from 'tailwindcss'

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
        // Brand
        teal: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dim: 'rgba(13,148,136,0.12)',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        coral: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dim: 'rgba(249,115,22,0.12)',
        },
        // Dark surfaces
        dark: {
          bg: '#080f0e',
          bg2: '#0d1614',
          surface: '#111a18',
          surface2: '#182320',
          border: 'rgba(255,255,255,0.07)',
          border2: 'rgba(255,255,255,0.12)',
        },
        // Home surfaces
        home: {
          bg: '#f0fdfa',
          bg2: '#ccfbf1',
          border: 'rgba(13,148,136,0.12)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        teal: '0 4px 20px rgba(13,148,136,0.1)',
        'teal-lg': '0 12px 40px rgba(13,148,136,0.15)',
        dark: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
        'slide-up': 'slideUp 0.32s cubic-bezier(0.32,0,0.15,1)',
        'bounce-in': 'bounceIn 0.6s ease',
        shimmer: 'shimmer 1.4s infinite',
        'typing-bounce': 'typingBounce 1.2s ease infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { transform: 'translateY(40px)' },
          'to': { transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typingBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
