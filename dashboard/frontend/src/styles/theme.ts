import { createTheme, type ThemeOptions } from '@mui/material/styles'

// DuetRight Brand Colors
const duetRightColors = {
  primary: '#FFBB2F',      // DuetRight Primary (Golden Yellow)
  secondary: '#FF8A3D',    // DuetRight Secondary (Orange)
  accent: '#037887',       // DuetRight Accent (Teal)
  light: '#FFFDFA',        // DuetRight Light (Off-white)
  dark: '#424143',         // DuetRight Dark (Charcoal)
  darkest: '#2C2B2E',      // DuetRight Darkest (Near Black)
}

// Define DuetRight brand theme
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: duetRightColors.primary,
      light: '#FFD073',
      dark: '#E6A600',
      contrastText: duetRightColors.darkest,
    },
    secondary: {
      main: duetRightColors.secondary,
      light: '#FFAB73',
      dark: '#E67A2E',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: duetRightColors.secondary, // Use DuetRight orange for warnings
    },
    info: {
      main: duetRightColors.accent,    // Use DuetRight teal for info
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: duetRightColors.light,  // DuetRight light background
      paper: '#ffffff',
    },
    text: {
      primary: duetRightColors.darkest,
      secondary: duetRightColors.dark,
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
  },
}

const darkThemeOptions: ThemeOptions = {
  ...lightThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: duetRightColors.primary,
      light: '#FFD073',
      dark: '#E6A600',
      contrastText: duetRightColors.darkest,
    },
    secondary: {
      main: duetRightColors.secondary,
      light: '#FFAB73',
      dark: '#E67A2E',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: duetRightColors.secondary,
    },
    info: {
      main: duetRightColors.accent,
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: duetRightColors.darkest,    // Dark DuetRight background
      paper: duetRightColors.dark,         // Charcoal for papers
    },
    text: {
      primary: duetRightColors.light,      // Light text on dark
      secondary: '#CCCCCC',                // Secondary light text
    },
  },
}

export const lightTheme = createTheme(lightThemeOptions)
export const darkTheme = createTheme(darkThemeOptions)

// Export a function to get theme based on mode
export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'dark' ? darkTheme : lightTheme
}