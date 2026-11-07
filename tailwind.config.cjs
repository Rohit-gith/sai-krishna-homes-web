/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Brand: Royal Gold (accents, icons, highlights). Text-safe on white from 600 up.
        primary: {
          50: '#FBF8F1',
          100: '#F5EDDA',
          200: '#EBD9B0',
          300: '#DEC07F',
          400: '#CFA557',
          500: '#B88B3E',
          600: '#9A7230',
          700: '#7C5B29',
          800: '#654A25',
          900: '#533E22',
          950: '#2F2111',
        },
        // Brand: Royal Emerald (prestige, greenery). Headings, primary buttons, dark sections.
        // Kept under the "navy" key so every existing component picks it up automatically.
        navy: {
          50: '#F1F6F3',
          100: '#E2ECE6',
          200: '#C3D8CC',
          300: '#96BBA6',
          400: '#63977D',
          500: '#3F7A5F',
          600: '#2C624B',
          700: '#1F513F',
          800: '#164536',
          900: '#0E3B32',
          950: '#082620',
        },
        ivory: '#FAF7F0',
        // Accent: champagne (highlights on dark)
        accent: {
          400: '#E8D3A0',
          500: '#D9BB78',
          600: '#C29A52',
        },
        // Warm, high-contrast neutrals (replaces Tailwind's cool slate) for comfortable reading.
        slate: {
          50: '#F8F7F4',
          100: '#F1EFEA',
          200: '#E3E0D8',
          300: '#CBC6BB',
          400: '#8A8478',
          500: '#6B665C',
          600: '#524E46',
          700: '#3D3A34',
          800: '#2A2824',
          900: '#1C1A17',
          950: '#0F0E0C',
        },
        // Sai Krishna Homes: "Midnight & Champagne Gold" luxury palette
        sk: {
          ink: '#0A0C10', // near-black midnight (backgrounds)
          night: '#11151C', // raised dark surfaces
          slate: '#1B212B', // borders / cards on dark
          gold: '#C9A65A', // champagne gold (primary accent)
          'gold-light': '#E6CF9A', // highlights, hover
          'gold-deep': '#9C7A35', // pressed / gradients
          ivory: '#F6F1E7', // text on dark, light backgrounds
          mist: '#A8A296', // muted text on dark
        },
      },
      fontFamily: {
        // Typography system: Playfair Display (headings) + Manrope (everything else)
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Pinyon Script"', 'cursive'],
        lux: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(8, 38, 32, 0.16)',
        glow: '0 0 0 4px rgba(184, 139, 62, 0.18)',
        gold: '0 18px 50px -14px rgba(154, 114, 48, 0.55)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scrollcue: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
      },
      animation: {
        'spin-slow': 'spin 28s linear infinite',
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        kenburns: 'kenburns 24s ease-out forwards',
        shimmer: 'shimmer 3.5s linear infinite',
        scrollcue: 'scrollcue 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
