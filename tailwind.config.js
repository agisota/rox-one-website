/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/pages/**/*.{js,jsx,ts,tsx}', './gatsby-browser.tsx'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                bg: '#08090C',
                'bg-deep': '#050609',
                'bg-lift': '#0E1116',
                fg: '#F5F4EF',
                'fg-muted': '#7E7E78',
                'fg-subtle': '#3E3E39',
            },
            fontFamily: {
                sans: ['"Geist Variable"', 'Geist', 'system-ui', 'sans-serif'],
                mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            keyframes: {
                'letter-in': {
                    '0%': { opacity: '0', transform: 'translateY(28px)', filter: 'blur(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(14px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'aurora-drift': {
                    '0%, 100%': { transform: 'translate(0, 0)', opacity: '1' },
                    '50%': { transform: 'translate(1.5vw, 1.2vh)', opacity: '0.6' },
                },
                'key-breathe': {
                    '0%, 100%': { opacity: '0.92', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.04)' },
                },
            },
            animation: {
                'letter-in': 'letter-in 1.8s cubic-bezier(0.16, 1, 0.3, 1) both',
                'fade-up': 'fade-up 1.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                'fade-in': 'fade-in 2.8s ease-out both',
                'aurora-drift': 'aurora-drift 34s ease-in-out infinite',
                'key-breathe': 'key-breathe 22s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
