/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    fontFamily: {
      'Montserrat': ['Montserrat'],
      'SourceSanPro': ['SourceSanPro']
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'primary001': '#F5F6FF',
        'primary002': '#D9DBE8',
        'primary003': '#BFC3D9',
        'primary004': '#8C92BA',
        'primary005': '#737AAB',
        'primary006': '#5C6499',
        'primary007': '#4D5380',
        'primary008': '#383D5D',
        'primary009': '#737AAB',
        'primary010': '#252A48',
        'primary011': '#1C203B',
        'linkColor': '#B7C4FF',
        'white001': '#FFFFFF',
        'white002': 'rgba(255, 255, 255, 0.90)',
        'white003': 'rgba(255, 255, 255, 0.80)',
        'white004': 'rgba(255, 255, 255, 0.70)',
        'white005': 'rgba(255, 255, 255, 0.60)',
        'white006': 'rgba(255, 255, 255, 0.50)',
        'white007': 'rgba(255, 255, 255, 0.40)',
        'white008': 'rgba(255, 255, 255, 0.30)',
        'white009': 'rgba(255, 255, 255, 0.20)',
        'white010': 'rgba(255, 255, 255, 0.10)',
        'btn-default': '#B7C4FF',
        'btn-hover':'#ABB7EF',
        'btn-pressed':'#9EAAE0',
        'warning-bg': 'rgba(255, 236, 168, 0.16)',
        'success-bg': 'rgba(146, 251, 145, 0.08)',
        'hover':'rgba(255, 255, 255, 0.08)',
        'selected': 'rgba(255, 255, 255, 0.12)',
        'pressed': 'rgba(255, 255, 255, 0.16)',
        'success-function': '#1CB562',
        'error-function': '#E11717',
        'warning-function': '#FFECA8',
        'light-error-function': '#FF9696'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}