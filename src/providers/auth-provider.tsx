'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Provider que inicializa o listener de autenticação Firebase
 * Exibe loading até confirmar autenticação inicial.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { initializeAuth, isAuthReady } = useUserStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const unsubscribe = initializeAuth();
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [initializeAuth]);

    const renderLoading = () => (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                bgcolor: 'background.default',
                zIndex: 1200,
            }}
        >
            <CircularProgress color="primary" size={48} />
        </Box>
    );

    if (!mounted || !isAuthReady) return renderLoading();

    return <>{children}</>;
}
