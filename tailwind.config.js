/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色调：清新蓝 / 薄荷绿（低饱和度）
        brand: {
          50: '#eefbf6',
          100: '#d6f5e8',
          200: '#b0e9d3',
          300: '#7fd8b9',
          400: '#4cc29c',
          500: '#2aa884',
          600: '#1d8a6c',
          700: '#186e58',
          800: '#165847',
          900: '#13483c'
        },
        ocean: {
          50: '#eef7fb',
          100: '#d7ecf5',
          200: '#b3dcec',
          300: '#82c4de',
          400: '#4aa5c9',
          500: '#2d88af',
          600: '#206d93',
          700: '#1d5877',
          800: '#1c4a63',
          900: '#1b3e54'
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 42, 67, 0.06), 0 4px 16px rgba(16, 42, 67, 0.06)',
        'card-hover': '0 2px 6px rgba(16, 42, 67, 0.08), 0 10px 28px rgba(16, 42, 67, 0.10)'
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem'
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'modal-in': 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 0.25s ease-out both'
      }
    }
  },
  plugins: []
}
