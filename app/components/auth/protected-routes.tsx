'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/app/store/user-store';
import { Box, CircularProgress } from '@mui/material';

/**
 * Wrapper para proteger rotas autenticadas.
 * Redireciona para /login se o usuário não estiver logado.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isAuthReady, isLoading } = useUserStore();

    useEffect(() => {
        if (isAuthReady && !user) {
            router.replace('/login');
        }
    }, [isAuthReady, user, router]);

    if (!isAuthReady || isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100%',
                }}
            >
                <CircularProgress color="primary" size={48} />
            </Box>
        );
    }

    if (!user) return null; // evita flash antes do redirect

    return <>{children}</>;
}
