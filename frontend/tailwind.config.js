/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        "spotify-black": "#121212",
        "spotify-dark": "#282828",
        "spotify-green": "#1DB954",
        "spotify-gray": "#b3b3b3",
        "spotify-light": "#535353",
        // shadcn CSS variable references
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.3", filter: "blur(20px)" },
          "50%": { opacity: "0.6", filter: "blur(24px)" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
        gradient: {
          to: { backgroundPosition: "var(--bg-size, 300%) 0" },
        },
        ripple: {
          "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-50%, -50%) scale(0.9)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        gradient: "gradient 8s linear infinite",
        ripple: "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
      },
    },
  },
  plugins: [],
};
