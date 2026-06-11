/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#06040f',
        panel: 'rgba(20, 14, 40, 0.72)',
        neon: {
          cyan: '#21e6ff',
          blue: '#3b6bff',
          purple: '#a855f7',
          magenta: '#e635ff',
          pink: '#ff4fd8',
          green: '#27f5a3',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        body: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(59,107,255,0.25)',
        'neon-cyan': '0 0 18px rgba(33,230,255,0.55)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseGlow: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
