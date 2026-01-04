import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/theme';

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
  // 1. Inicialização "Lazy" (Lê direto do localStorage na primeira renderização)
  // Isso evita o flash de tema incorreto e remove a necessidade de useEffect para leitura inicial
  const [mode, setMode] = React.useState<ThemeMode>(() => {
    try {
      // Verifica se estamos no navegador
      if (typeof window !== 'undefined') {
        const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
        if (savedMode) return savedMode;

        // Se não tem salvo, verifica preferência do sistema
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      }
    } catch (e) {
      console.warn('Erro ao ler tema:', e);
    }
    return 'light'; // Padrão
  });

  // 2. Salva no localStorage sempre que o modo mudar
  React.useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme mode to localStorage', error);
    }
  }, [mode]);

  // 3. Função para alternar o modo
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // 4. Memoriza o tema ativo
  const theme = React.useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline aplica o reset CSS e a cor de fundo correta (body background) */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}