/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary":                    "#001944",
        "primary-container":          "#002c6e",
        "on-primary":                 "#ffffff",
        "on-primary-container":       "#6b95f3",
        "primary-fixed":              "#d9e2ff",
        "primary-fixed-dim":          "#b0c6ff",
        "on-primary-fixed":           "#001945",
        "on-primary-fixed-variant":   "#00429c",

        "secondary":                  "#2a6b2c",
        "secondary-container":        "#acf4a4",
        "on-secondary":               "#ffffff",
        "on-secondary-container":     "#307231",
        "secondary-fixed":            "#acf4a4",
        "secondary-fixed-dim":        "#91d78a",
        "on-secondary-fixed":         "#002203",
        "on-secondary-fixed-variant": "#0c5216",

        "tertiary":                   "#2d1400",
        "tertiary-container":         "#4b2600",
        "on-tertiary":                "#ffffff",
        "on-tertiary-container":      "#e17e00",
        "tertiary-fixed":             "#ffdcc2",
        "tertiary-fixed-dim":         "#ffb77a",
        "on-tertiary-fixed":          "#2e1500",
        "on-tertiary-fixed-variant":  "#6d3a00",

        "surface":                    "#f3faff",
        "surface-dim":                "#c7dde9",
        "surface-bright":             "#f3faff",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#e6f6ff",
        "surface-container":          "#dbf1fe",
        "surface-container-high":     "#d5ecf8",
        "surface-container-highest":  "#cfe6f2",
        "surface-variant":            "#cfe6f2",
        "inverse-surface":            "#1e333c",
        "inverse-on-surface":         "#dff4ff",
        "inverse-primary":            "#b0c6ff",

        "on-surface":                 "#071e27",
        "on-surface-variant":         "#454652",
        "on-background":              "#071e27",
        "background":                 "#f3faff",

        "outline":                    "#767683",
        "outline-variant":            "#c6c5d4",

        "error":                      "#ba1a1a",
        "error-container":            "#ffdad6",
        "on-error":                   "#ffffff",
        "on-error-container":         "#93000a",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        display:  ["Manrope", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        "2xl":   "1rem",
        full:    "9999px",
      },
      boxShadow: {
        ambient: "0px 12px 32px rgba(7, 30, 39, 0.06)",
        card:    "0px 4px 16px rgba(7, 30, 39, 0.04)",
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
    },
  },
  plugins: [],
}