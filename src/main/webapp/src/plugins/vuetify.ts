import "vuetify/styles";
import "@fontsource-variable/open-sans/index.css";
import "@fontsource-variable/material-symbols-rounded/fill.css";
import "@/assets/styles/material-symbols.css";

import { h } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import type { IconSet, IconAliases, IconProps } from "vuetify";
import { VClassIcon } from "vuetify/lib/composables/icons.mjs";

// X-Road 8.0 Color Palette
const Color = {
  // Neutral
  WHITE: "#FFFFFF",
  BLACK: "#000000",
  // Dark maroon (D)
  D_10: "#FCFAFF",
  D_50: "#F7F5FA",
  D_100: "#E3E0E9",
  D_200: "#BEB5D0",
  D_300: "#8F7DB2",
  D_400: "#583F8B",
  D_500: "#3F2080",
  D_600: "#220066",
  D_700: "#16094E",
  D_800: "#0B0633",
  D_900: "#000428",
  // Blue (B)
  B_10: "#F7FCFF",
  B_50: "#EAF3F9",
  B_100: "#DDE8F0",
  B_200: "#B3CFE5",
  B_300: "#84BDE9",
  B_400: "#55ACEE",
  B_500: "#1B4361",
  B_600: "#143752",
  B_700: "#0B283E",
  B_800: "#0E1D2E",
  B_900: "#061623",
  // Magenta (M)
  M_600: "#99006B",
  M_900: "#470233",
  // Red (R)
  R_300: "#FF7573",
  R_400: "#FF0503",
  R_600: "#B50402",
  // Yellow (Y)
  Y_200: "#FEF5A3",
  Y_300: "#FCEF70",
  Y_400: "#F9E100",
  Y_700: "#736800",
  Y_900: "#2E2900",
  // Green (G)
  G_300: "#BBE55C",
  G_400: "#9CE100",
  G_700: "#567C00",
};

// Material Symbols Rounded icon aliases (matching X-Road)
const msrAliases: IconAliases = {
  // Keyboard aliases
  alt: "keyboard_alt",
  arrowdown: "keyboard_arrow_down",
  arrowleft: "keyboard_arrow_left",
  arrowright: "keyboard_arrow_right",
  arrowup: "keyboard_arrow_up",
  backspace: "keyboard_backspace",
  command: "keyboard_command_key",
  ctrl: "keyboard_control_key",
  enter: "keyboard_return",
  shift: "shift",
  space: "space_bar",
  // Standard Vuetify aliases
  collapse: "arrow_drop_up",
  complete: "check",
  cancel: "cancel",
  close: "close",
  delete: "delete_forever",
  clear: "close",
  success: "check_circle",
  info: "info",
  warning: "warning",
  error: "error",
  prev: "chevron_left",
  next: "chevron_right",
  checkboxOn: "check_box",
  checkboxOff: "check_box_outline_blank",
  checkboxIndeterminate: "indeterminate_check_box",
  delimiter: "fiber_manual_record",
  sortAsc: "arrow_upward",
  sortDesc: "arrow_downward",
  expand: "arrow_drop_down",
  menu: "menu",
  subgroup: "chevron_right",
  dropdown: "arrow_drop_down",
  radioOn: "radio_button_checked",
  radioOff: "radio_button_unchecked",
  edit: "edit",
  ratingEmpty: "star_outline",
  ratingFull: "star",
  ratingHalf: "star_half",
  loading: "cached",
  first: "first_page",
  last: "last_page",
  unfold: "unfold_more",
  file: "attach_file",
  plus: "add",
  minus: "remove",
  sort: "sort",
  treeviewCollapse: "arrow_drop_down",
  treeviewExpand: "chevron_right",
  calendar: "event",
  eyeDropper: "colorize",
  upload: "upload",
  color: "palette",
};

// Material Symbols Rounded icon set
const msr: IconSet = {
  component: (props: IconProps) => {
    const icon = typeof props.icon === "string" ? props.icon : "";
    return h(VClassIcon, { ...props, class: ["msr"], innerHTML: icon });
  },
};

const lightTheme = {
  dark: false,
  colors: {
    // Vuetify standard colors
    background: Color.WHITE,
    surface: Color.B_100,
    primary: Color.D_400,
    secondary: Color.D_600,
    success: Color.G_700,
    warning: Color.Y_700,
    error: Color.R_600,
    info: Color.B_500,

    "on-background": Color.D_900,
    "on-surface": Color.D_900,
    "on-primary": Color.WHITE,
    "on-secondary": Color.WHITE,
    "on-success": Color.WHITE,
    "on-warning": Color.WHITE,
    "on-error": Color.WHITE,
    "on-info": Color.WHITE,

    // Custom X-Road colors
    "surface-variant": Color.B_100,
    "on-surface-variant": Color.D_400,
    "surface-container": Color.WHITE,
    "surface-container-low": Color.B_50,
    "surface-container-high": Color.B_50,
    "surface-dim": Color.B_50,

    "inverse-primary": Color.Y_200,
    "inverse-surface": Color.B_700,
    "on-inverse-surface": Color.WHITE,

    // App-specific (Security Server blue)
    "app-specific": Color.B_600,
    "on-app-specific": Color.B_50,

    accent: Color.M_600,
    "on-accent": Color.WHITE,
    tertiary: Color.M_600,
    "on-tertiary": Color.WHITE,

    border: Color.B_100,
    "border-bright": Color.B_400,
    "border-strong": Color.D_600,
  },
};

const darkTheme = {
  dark: true,
  colors: {
    // Vuetify standard colors
    background: Color.D_900,
    surface: Color.B_700,
    primary: Color.D_200,
    secondary: Color.D_100,
    success: Color.G_300,
    warning: Color.Y_300,
    error: Color.R_300,
    info: Color.B_300,

    "on-background": Color.WHITE,
    "on-surface": Color.WHITE,
    "on-primary": Color.D_700,
    "on-secondary": Color.D_700,
    "on-success": Color.D_900,
    "on-warning": Color.D_900,
    "on-error": Color.D_900,
    "on-info": Color.D_900,

    // Custom X-Road colors
    "surface-variant": Color.B_700,
    "on-surface-variant": Color.D_200,
    "surface-container": Color.B_800,
    "surface-container-low": Color.B_800,
    "surface-container-high": Color.B_700,
    "surface-dim": Color.B_900,

    "inverse-primary": Color.M_600,
    "inverse-surface": Color.B_100,
    "on-inverse-surface": Color.M_900,

    // App-specific (Security Server blue)
    "app-specific": Color.B_100,
    "on-app-specific": Color.B_800,

    accent: Color.Y_200,
    "on-accent": Color.Y_900,
    tertiary: Color.R_300,
    "on-tertiary": Color.R_400,

    border: Color.B_600,
    "border-bright": Color.B_400,
    "border-strong": Color.D_100,
  },
};

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "msr",
    aliases: msrAliases,
    sets: {
      msr,
    },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    // Match X-Road component defaults
    VTextField: {
      variant: "underlined",
    },
    VSelect: {
      variant: "underlined",
    },
    VCombobox: {
      variant: "underlined",
    },
    VAutocomplete: {
      variant: "underlined",
    },
    VBtn: {
      variant: "flat",
    },
    VCard: {
      elevation: 1,
    },
    VDataTable: {
      loaderHeight: 2,
    },
    VTooltip: {
      maxWidth: "280",
    },
  },
});
