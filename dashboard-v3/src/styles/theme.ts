import React from 'react';
import { createTheme, ThemeOptions } from '@mui/material/styles';

// DuetRight Official Brand Colors
const colors = {
  primary: {
    main: '#FFBB2F', // DuetRight Primary Yellow
    light: '#FFFDFA', // DuetRight Lightest
    dark: '#FF8A3D', // DuetRight Secondary Orange
    contrastText: '#2C2B2E', // DuetRight Darkest
  },
  secondary: {
    main: '#037887', // DuetRight Accent Teal
    light: '#4db6ac',
    dark: '#00695c',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    ...colors,
    background: {
      default: '#FFFDFA', // DuetRight Lightest
      paper: '#ffffff',
    },
    text: {
      primary: '#2C2B2E', // DuetRight Darkest
      secondary: 'rgba(44, 43, 46, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);

export const darkTheme = createTheme({
  ...lightThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFBB2F', // DuetRight Primary Yellow
      light: '#FFFDFA', // DuetRight Lightest
      dark: '#FF8A3D', // DuetRight Secondary Orange
      contrastText: '#2C2B2E', // DuetRight Darkest
    },
    secondary: {
      main: '#037887', // DuetRight Accent Teal
      light: '#4db6ac',
      dark: '#00695c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#2C2B2E', // DuetRight Darkest
      paper: '#3A3939',
    },
    text: {
      primary: '#FFFDFA', // DuetRight Lightest
      secondary: '#B8B8B8',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
});

// Hook for theme context
export const useThemeMode = () => {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  
  const toggleTheme = React.useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const theme = React.useMemo(() => 
    mode === 'light' ? lightTheme : darkTheme, 
    [mode]
  );
  
  return { mode, theme, toggleTheme };
};