/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "on-primary-container": "#f8f7ff",
              "on-secondary-fixed-variant": "#832600",
              "primary-fixed-dim": "#b3c5ff",
              "inverse-surface": "#2f3131",
              "surface-container-lowest": "#ffffff",
              "surface-bright": "#f9f9f9",
              "surface-dim": "#dadada",
              "on-secondary": "#ffffff",
              "tertiary-container": "#cc4204",
              "surface-variant": "#e2e2e2",
              "secondary-fixed-dim": "#ffb59d",
              "inverse-primary": "#b3c5ff",
              "tertiary-fixed": "#ffdbd0",
              "surface-tint": "#0054d6",
              "primary": "#0050cb",
              "tertiary-fixed-dim": "#ffb59d",
              "on-primary-fixed-variant": "#003fa4",
              "primary-container": "#0066ff",
              "surface-container-high": "#e8e8e8",
              "secondary": "#ab3500",
              "on-surface": "#1a1c1c",
              "surface": "#f9f9f9",
              "inverse-on-surface": "#f1f1f1",
              "surface-container-low": "#f3f3f3",
              "secondary-container": "#fe6a34",
              "tertiary": "#a33200",
              "error": "#ba1a1a",
              "on-primary": "#ffffff",
              "outline-variant": "#c2c6d8",
              "on-tertiary-container": "#fff6f4",
              "surface-container-highest": "#e2e2e2",
              "surface-container": "#eeeeee",
              "on-primary-fixed": "#001849",
              "on-tertiary": "#ffffff",
              "error-container": "#ffdad6",
              "primary-fixed": "#dae1ff",
              "secondary-fixed": "#ffdbd0",
              "outline": "#727687",
              "on-error-container": "#93000a",
              "on-tertiary-fixed": "#390c00",
              "on-error": "#ffffff",
              "on-secondary-fixed": "#390c00",
              "on-surface-variant": "#424656",
              "background": "#f9f9f9",
              "on-background": "#1a1c1c",
              "on-secondary-container": "#5d1900",
              "on-tertiary-fixed-variant": "#832600"
      },
      "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
      },
      "fontFamily": {
              "headline": ["Inter"],
              "body": ["Inter"],
              "label": ["Inter"]
      },
      "animation": {
          "bounce-slow": "bounce 3s infinite"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
