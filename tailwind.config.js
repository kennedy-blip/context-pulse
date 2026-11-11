/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#070a12',
        panel: '#0f172a',
        violet: '#8b5cf6',
        emerald: '#10b981',
        cyan: '#06b6d4',
        amber: '#f59e0b',
        rose: '#f43f5e',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'violet': '0 0 30px rgba(139,92,246,.18)',
        'card': '0 12px 36px rgba(0,0,0,.2)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'slide-in': 'slideIn .22s ease-out',
        'fade-in': 'fadeIn .2s ease-out',
      },
      keyframes: {
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.45' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
