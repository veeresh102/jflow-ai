/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        surface: '#0d0d0f',
        panel: '#141417',
        border: '#1e1e24',
        accent: '#4f6ef7',
        accentHover: '#3d5ce6',
        muted: '#5a5a72',
        textPrimary: '#e8e8f0',
        textSecondary: '#8888a8',
        success: '#3ecf8e',
        warning: '#f5a623',
        danger: '#ef4444',
      }
    }
  },
  plugins: []
}
