import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cartesian 温暖石质与墨水色盘 (Museum-catalog warm stone)
        'cartesian-bg': '#EDE8E0',
        'cartesian-bg-subtle': '#E2DBD1',
        'cartesian-card-bg': 'rgba(255, 255, 255, 0.45)',
        'cartesian-card-solid': '#F7F4EF',
        'cartesian-ink': '#1A1A1A',
        'cartesian-muted': '#5A5A5A',
        'cartesian-accent': '#8A8178',
        'cartesian-line': '#B8B0A4',
        'cartesian-line-faint': 'rgba(184, 176, 164, 0.4)',

        // 功能点缀色 (低饱和、克制温和)
        'cartesian-success': '#4A6B53',
        'cartesian-warning': '#9E6D38',
        'cartesian-danger': '#944848',
      },
      fontFamily: {
        'display': ['var(--font-inter)', '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"微软雅黑"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'body': ['var(--font-inter)', '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"微软雅黑"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'sans': ['var(--font-inter)', '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"微软雅黑"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'serif'],
        'timer': ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(3rem, 6vw, 5.5rem)', { lineHeight: '1.08', letterSpacing: '-0.01em', fontWeight: '400' }],
        'h1': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '400' }],
        'h2': ['clamp(1.8rem, 3.5vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '400' }],
        'h3': ['clamp(1.2rem, 2vw, 1.6rem)', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '400' }],
        'lead': ['clamp(1rem, 1.25vw, 1.2rem)', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['clamp(0.9rem, 1.1vw, 1.05rem)', { lineHeight: '1.65', fontWeight: '400' }],
        'small': ['clamp(0.82rem, 0.9vw, 0.9rem)', { lineHeight: '1.55', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1', letterSpacing: '3px', fontWeight: '500' }],
        'micro': ['0.7rem', { lineHeight: '1', letterSpacing: '2px', fontWeight: '500' }],
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
        'circle': '50%',
      },
      boxShadow: {
        'none': 'none',
        'cartesian-card': '0 1px 3px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
}

export default config
