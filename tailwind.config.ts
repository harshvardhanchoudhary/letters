import type { Config } from 'tailwindcss'

// LEARN: Tailwind lets us define a custom design system here.
// Instead of using default colours like "blue-500", we define our own
// named tokens (paper, ink, accent) that match the feel of this app.
// CSS variables bridge these to the stylesheet so we could later add
// a dark mode or seasonal themes without touching component code.

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-dark': 'var(--paper-dark)',
        'paper-darker': 'var(--paper-darker)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'ink-faint': 'var(--ink-faint)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        border: 'var(--border)',
        'border-dark': 'var(--border-dark)',
      },
      fontFamily: {
        garamond: ['var(--font-garamond)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
