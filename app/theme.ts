'use client';
import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#C68642', // orange/cobre
      light: '#D4A574',
      dark: '#A36A2F',
      contrastText: '#FFF9F2',
    },
    secondary: {
      main: '#8B5E3C', // brown2
      light: '#A67C52',
      dark: '#6B4A2E',
      contrastText: '#FAEBD7',
    },
    background: {
      default: '#FAEBD7', // beige claro
      paper: '#FFF9F2', // beige-mid (quase branco)
    },
    text: {
      primary: '#4E2C0A', // brown escuro
      secondary: '#8B5E3C', // brown2
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#C68642', // usa o orange
    },
    info: {
      main: '#0288D1',
    },
    success: {
      main: '#388E3C',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Caveat", cursive',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 4px 8px rgba(78, 44, 10, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(78, 44, 10, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(78, 44, 10, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 8px rgba(78, 44, 10, 0.15)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(78, 44, 10, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#C68642',
            },
          },
        },
      },
    },
  },
});