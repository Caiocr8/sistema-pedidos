// mui-provider.tsx

'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { lightTheme, darkTheme } from '@/app/theme'; // Ajuste o caminho se necessário

type ThemeMode = 'light' | 'dark';

interface MuiProviderProps {
  children: React.ReactNode;
}

// Contexto para permitir que outros componentes alternem o modo
export const ThemeModeContext = React.createContext({
  mode: 'light' as ThemeMode,
  toggleMode: () => { },
});

export default function MuiProvider({ children }: MuiProviderProps) {
  const [mode, setMode] = React.useState<ThemeMode>('light');
  const [mounted, setMounted] = React.useState(false);

  // Efeito para buscar a preferência do usuário (localStorage ou sistema)
  // Só executa após a montagem no cliente
  React.useEffect(() => {
    setMounted(true);
    try {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setMode(savedMode || (prefersDark ? 'dark' : 'light'));
    } catch (error) {
      // Em caso de erro (ex: localStorage desabilitado), usa o padrão
      console.error('Failed to access theme mode from localStorage', error);
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Efeito para salvar a preferência no localStorage sempre que o modo mudar
  React.useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('themeMode', mode);
      } catch (error) {
        console.error('Failed to save theme mode to localStorage', error);
      }
    }
  }, [mode, mounted]);

  // Função para alternar o modo
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Memoriza o tema com base no modo
  const theme = React.useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

  // Previne "flash" (hydration mismatch)
  // Retorna um tema padrão (light) antes do useEffect acima rodar no cliente
  if (!mounted) {
    return (
      <AppRouterCacheProvider>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    );
  }

  // Retorno principal após a hidratação
  return (
    <AppRouterCacheProvider>
      <ThemeModeContext.Provider value={{ mode, toggleMode }}>
        <ThemeProvider theme={theme}>
          {/* CssBaseline aplica os estilos globais (como o background do <body>) */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </AppRouterCacheProvider>
  );
}