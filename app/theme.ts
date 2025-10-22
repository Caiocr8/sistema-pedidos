// theme.ts

'use client';
import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Tipografia compartilhada
const baseTypography: ThemeOptions['typography'] = {
  fontFamily: '"Segoe UI", sans-serif',
  h1: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
  h2: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
  h3: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
  h4: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
  h5: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
  h6: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
};

// Overrides compartilhados
const baseComponents: ThemeOptions['components'] = {
  // Adiciona o background global dinâmico ao <body>
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: {
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundSize: '30px 30px',
        // Fundo dinâmico baseado no modo light/dark
        backgroundImage:
          theme.palette.mode === 'light'
            // Cor dos pontos para o modo claro (usando secondary.light)
            ? `radial-gradient(circle, ${theme.palette.secondary.light} 1px, transparent 1px)`
            // Cor dos pontos para o modo escuro (usando background.paper)
            : `radial-gradient(circle, ${theme.palette.background.paper} 1px, transparent 1px)`,
      },
    }),
  },

  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
      },
      contained: ({ theme }) => ({
        boxShadow: `0 4px 8px ${theme.palette.mode === 'light'
          ? 'rgba(78, 44, 10, 0.15)'
          : 'rgba(255,255,255,0.08)'
          }`,
        '&:hover': {
          boxShadow: `0 6px 12px ${theme.palette.mode === 'light'
            ? 'rgba(78, 44, 10, 0.2)'
            : 'rgba(255,255,255,0.12)'
            }`,
        },
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
      elevation1: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 2px 4px rgba(78, 44, 10, 0.1)'
            : '0 2px 4px rgba(0,0,0,0.6)',
      }),
      elevation2: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 4px 8px rgba(78, 44, 10, 0.15)'
            : '0 4px 8px rgba(0,0,0,0.7)',
      }),
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: theme.palette.warning.main,
          },
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.secondary,
        '&.Mui-focused': {
          color: theme.palette.warning.main,
        },
      }),
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& fieldset': {
          borderColor:
            theme.palette.mode === 'light'
              ? 'rgba(139, 94, 60, 0.23)'
              : 'rgba(209, 167, 123, 0.23)',
        },
        '&:hover fieldset': {
          borderColor: theme.palette.warning.main,
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.warning.main,
        },
      }),
    },
  },
};

// 🌞 Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#C68642',
      light: '#D4A574',
      dark: '#A36A2F',
      contrastText: '#FFF9F2',
    },
    secondary: {
      main: '#8B5E3C',
      light: '#A67C52',
      dark: '#6B4A2E',
      contrastText: '#FAEBD7',
    },
    background: {
      default: '#FAEBD7',
      paper: '#FFF9F2',
    },
    text: {
      primary: '#4E2C0A',
      secondary: '#8B5E3C',
    },
    error: { main: '#D32F2F' },
    warning: { main: '#C68642' },
    info: { main: '#0288D1' },
    success: { main: '#388E3C' },
  },
  shape: { borderRadius: 12 },
  typography: baseTypography,
  components: baseComponents,
});

// 🌚 Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E6B980',
      light: '#F5CFA2',
      dark: '#B37638',
      contrastText: '#1E130C',
    },
    secondary: {
      main: '#D1A77B',
      light: '#EBC89F',
      dark: '#A47B4E',
      contrastText: '#1E130C',
    },
    background: {
      default: '#1E130C',
      paper: '#2C1C12',
    },
    text: {
      primary: '#FFF9F2',
      secondary: '#D1A77B',
    },
    error: { main: '#EF5350' },
    warning: { main: '#E6B980' },
    info: { main: '#81D4FA' },
    success: { main: '#81C784' },
  },
  shape: { borderRadius: 12 },
  typography: baseTypography,
  components: baseComponents,
});