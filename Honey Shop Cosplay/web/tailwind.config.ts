import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}'], theme: { extend: { colors: { honey: { 50: '#fff8e7', 100: '#ffefbf', 400: '#f6b73c', 500: '#e89b22', 700: '#a85f11' }, ink: '#3f2a20' }, boxShadow: { soft: '0 12px 40px rgba(105, 61, 17, .10)' } } }, plugins: [] } satisfies Config;
