import { defineSyntaxTheme, defineTheme } from "@astryxdesign/core/theme";

/**
Night Owl Theme

Dark-only theme built on the canonical Night Owl palette (Sarah Drasner).
Midnight backdrop (#011627) with luminous syntax-inspired accents of cyan
(#7fdbca), magenta (#c792ea), and golden amber (#ffcb8b). Razor-sharp
rectangular geometry (radius 0) with tactile, hard-edged block shadows.

Light token slots are locked to the dark values — the theme is forced to
dark mode via `<Theme mode="dark">` and renders identically in both slots.
*/

const nightowlSyntax = defineSyntaxTheme({
  name: "nightowl",
  tokens: {
    attribute: "#ffcb8b",
    background: "#011627",
    comment: "#637777",
    constant: "#f78c6c",
    function: "#82aaff",
    keyword: "#c792ea",
    number: "#ffcb8b",
    operator: "#7fdbca",
    property: "#7fdbca",
    punctuation: "#d6deeb",
    string: "#7fdbca",
    tag: "#f78c6c",
    type: "#c792ea",
    variable: "#d6deeb"
  }
});

export const nightowlTheme = defineTheme({
  components: {
    badge: {
      base: { borderRadius: "0" },
      "variant:error": { backgroundColor: "#ef5350", color: "#011627" },
      "variant:info": { backgroundColor: "#82aaff", color: "#011627" },
      "variant:neutral": {
        backgroundColor: "var(--color-background-gray)",
        color: "var(--color-text-gray)"
      },
      "variant:success": { backgroundColor: "#22da6e", color: "#011627" },
      "variant:warning": { backgroundColor: "#ffcb8b", color: "#011627" }
    },
    button: {
      base: { borderRadius: "0" },
      "variant:destructive": {
        backgroundColor: "var(--color-error-muted)",
        color: "var(--color-error)"
      },
      "variant:primary": {
        backgroundColor: "var(--color-accent)",
        boxShadow: "2px 2px 0 0 #21c7a8",
        color: "var(--color-on-accent)"
      }
    },
    card: {
      base: {
        border: "1px solid var(--color-border)",
        borderRadius: "0",
        boxShadow: "var(--shadow-med)"
      }
    }
  },
  motion: { fast: 125, medium: 300, ratio: 0.75, slow: 700 },
  name: "nightowl",
  syntax: nightowlSyntax,
  tokens: {
    // Backgrounds — midnight backdrop with a single lifted surface tone.
    // Dark-only: light slot locked to the dark value.
    "--color-background-body": ["#011627", "#011627"],
    "--color-background-card": ["#0b2942", "#0b2942"],
    "--color-background-muted": ["#011627", "#011627"],
    "--color-background-popover": ["#0b2942", "#0b2942"],
    "--color-background-surface": ["#0b2942", "#0b2942"],

    // Accents — luminous cyan primary, magenta secondary, amber attention.
    "--color-accent": ["#7fdbca", "#7fdbca"],
    "--color-accent-muted": ["#0b2942", "#0b2942"],
    "--color-neutral": ["#FFFFFF1A", "#FFFFFF1A"],

    // Overlays
    "--color-overlay": ["#011627CC", "#011627CC"],
    "--color-overlay-hover": ["#7fdbca1A", "#7fdbca1A"],
    "--color-overlay-pressed": ["#7fdbca33", "#7fdbca33"],

    // Text
    "--color-on-accent": ["#011627", "#011627"],
    "--color-on-dark": "#d6deeb",
    "--color-on-error": ["#011627", "#011627"],
    "--color-on-light": "#011627",
    "--color-on-success": ["#011627", "#011627"],
    "--color-on-warning": "#011627",
    "--color-text-accent": ["#7fdbca", "#7fdbca"],
    "--color-text-disabled": ["#3f5465", "#3f5465"],
    "--color-text-primary": ["#d6deeb", "#d6deeb"],
    "--color-text-secondary": ["#637777", "#637777"],

    // Icons
    "--color-icon-accent": ["#21c7a8", "#21c7a8"],
    "--color-icon-disabled": ["#3f5465", "#3f5465"],
    "--color-icon-primary": ["#d6deeb", "#d6deeb"],
    "--color-icon-secondary": ["#637777", "#637777"],

    // Status — Night Owl status hues with tinted alpha muted surfaces.
    "--color-error": ["#ef5350", "#ef5350"],
    "--color-error-muted": ["#ef53503D", "#ef53503D"],
    "--color-success": ["#22da6e", "#22da6e"],
    "--color-success-muted": ["#22da6e3D", "#22da6e3D"],
    "--color-warning": ["#ffcb8b", "#ffcb8b"],
    "--color-warning-muted": ["#ffcb8b3D", "#ffcb8b3D"],

    // Borders
    "--color-border": ["#1d3b53", "#1d3b53"],
    "--color-border-emphasized": ["#21c7a8", "#21c7a8"],

    // Effects
    "--color-shadow": ["#010b14", "#010b14"],
    "--color-skeleton": ["#0b2942", "#0b2942"],
    "--color-tint-hover": ["#7fdbca", "#7fdbca"],

    // Categorical accents mapped onto the luminous accent hues.
    "--color-background-blue": ["#82aaff3D", "#82aaff3D"],
    "--color-background-cyan": ["#7fdbca3D", "#7fdbca3D"],
    "--color-background-gray": ["#FFFFFF1A", "#FFFFFF1A"],
    "--color-background-green": ["#22da6e3D", "#22da6e3D"],
    "--color-background-orange": ["#f78c6c3D", "#f78c6c3D"],
    "--color-background-pink": ["#c792ea3D", "#c792ea3D"],
    "--color-background-purple": ["#c792ea3D", "#c792ea3D"],
    "--color-background-red": ["#ef53503D", "#ef53503D"],
    "--color-background-teal": ["#7fdbca3D", "#7fdbca3D"],
    "--color-background-yellow": ["#ffcb8b3D", "#ffcb8b3D"],
    "--color-border-blue": ["#82aaff", "#82aaff"],
    "--color-border-cyan": ["#21c7a8", "#21c7a8"],
    "--color-border-gray": ["#1d3b53", "#1d3b53"],
    "--color-border-green": ["#22da6e", "#22da6e"],
    "--color-border-orange": ["#f78c6c", "#f78c6c"],
    "--color-border-pink": ["#c792ea", "#c792ea"],
    "--color-border-purple": ["#c792ea", "#c792ea"],
    "--color-border-red": ["#ef5350", "#ef5350"],
    "--color-border-teal": ["#21c7a8", "#21c7a8"],
    "--color-border-yellow": ["#ffcb8b", "#ffcb8b"],
    "--color-icon-blue": ["#82aaff", "#82aaff"],
    "--color-icon-cyan": ["#21c7a8", "#21c7a8"],
    "--color-icon-gray": ["#637777", "#637777"],
    "--color-icon-green": ["#22da6e", "#22da6e"],
    "--color-icon-orange": ["#f78c6c", "#f78c6c"],
    "--color-icon-pink": ["#c792ea", "#c792ea"],
    "--color-icon-purple": ["#c792ea", "#c792ea"],
    "--color-icon-red": ["#ef5350", "#ef5350"],
    "--color-icon-teal": ["#21c7a8", "#21c7a8"],
    "--color-icon-yellow": ["#ffcb8b", "#ffcb8b"],
    "--color-text-blue": ["#82aaff", "#82aaff"],
    "--color-text-cyan": ["#7fdbca", "#7fdbca"],
    "--color-text-gray": ["#d6deeb", "#d6deeb"],
    "--color-text-green": ["#22da6e", "#22da6e"],
    "--color-text-orange": ["#f78c6c", "#f78c6c"],
    "--color-text-pink": ["#c792ea", "#c792ea"],
    "--color-text-purple": ["#c792ea", "#c792ea"],
    "--color-text-red": ["#ef5350", "#ef5350"],
    "--color-text-teal": ["#7fdbca", "#7fdbca"],
    "--color-text-yellow": ["#ffcb8b", "#ffcb8b"],

    // Radius — razor-sharp rectangular geometry.
    "--radius-container": "0",
    "--radius-element": "0",
    "--radius-full": "9999px",
    "--radius-inner": "0",
    "--radius-none": "0",
    "--radius-page": "0",

    // Shadows — tactile, hard-edged block shadows. Zero blur, solid offset.
    "--shadow-high": "8px 8px 0 0 #010b14",
    "--shadow-inset-error": "inset 0 0 0 2px #ef53504D",
    "--shadow-inset-hover": "inset 0 0 0 2px #7fdbca4D",
    "--shadow-inset-selected": "inset 0 0 0 2px #7fdbca80",
    "--shadow-inset-success": "inset 0 0 0 2px #22da6e4D",
    "--shadow-inset-warning": "inset 0 0 0 2px #ffcb8b4D",
    "--shadow-low": "2px 2px 0 0 #010b14",
    "--shadow-med": "4px 4px 0 0 #010b14"
  },
  typography: {
    body: {
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      family: "Figtree"
    },
    code: {
      fallbacks:
        '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      family: "ui-monospace"
    },
    heading: {
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      family: "Figtree",
      weights: { 3: "bold", 4: "bold" }
    },
    scale: { base: 14, ratio: 1.2 }
  }
});
