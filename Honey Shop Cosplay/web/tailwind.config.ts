import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#fffdf5',
          100: '#fff7db',
          200: '#ffedb3',
          300: '#ffdf80',
          400: '#ffc847',
          500: '#ffaa1d',
          600: '#f58700',
          700: '#d96c00',
          800: '#a64f00',
          900: '#753600',
        },
        warm: {
          cream: '#fffaf0',
          ivory: '#fdfbf7',
          beige: '#fcf6ec',
          caramel: '#edd5b8',
          choco: '#382313',
          muted: '#7a5a41',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -5px rgba(245, 135, 0, 0.08)',
        cute: '0 6px 0px #ebd4be',
        'cute-sm': '0 3px 0px #ebd4be',
        'cute-orange': '0 5px 0px #cc5f00',
        card: '0 12px 32px rgba(92, 53, 21, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
