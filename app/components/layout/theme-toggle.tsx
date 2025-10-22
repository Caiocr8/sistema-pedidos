'use client';

import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { ThemeModeContext } from '@/app/providers/mui-provider';

export default function ThemeToggle() {
    const theme = useTheme();
    const { mode, toggleMode } = useContext(ThemeModeContext);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Previne hidratação incorreta
    if (!mounted) {
        return (
            <IconButton
                color="inherit"
                sx={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1300,
                    bgcolor: 'background.paper',
                    boxShadow: theme.palette.mode === 'light'
                        ? '0 2px 8px rgba(78, 44, 10, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.5)',
                    visibility: 'hidden',
                }}
            >
                <Sun size={20} />
            </IconButton>
        );
    }

    return (
        <Tooltip title={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'}>
            <IconButton
                onClick={toggleMode}
                color="inherit"
                aria-label={mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                sx={{
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1300,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: theme.palette.mode === 'light'
                        ? '0 2px 8px rgba(78, 44, 10, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.05)',
                        boxShadow: theme.palette.mode === 'light'
                            ? '0 4px 12px rgba(78, 44, 10, 0.2)'
                            : '0 4px 12px rgba(0, 0, 0, 0.6)',
                    },
                    transition: 'all 0.3s ease',
                }}
            >
                {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </IconButton>
        </Tooltip>
    );
}