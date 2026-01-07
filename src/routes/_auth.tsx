import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';
import { useUserStore } from '@/store/user-store';
import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';

export const Route = createFileRoute('/_auth')({
    component: AuthLayout,
});

function AuthLayout() {
    // CORREÇÃO AQUI: mudou de 'loading' para 'isLoading'
    const { user, isLoading } = useUserStore();
    const router = useRouter();

    useEffect(() => {
        // Se terminou de carregar e não tem usuário, manda pro login
        if (!isLoading && !user) {
            router.navigate({ to: '/login', replace: true });
        }
    }, [user, isLoading, router]);

    // Enquanto carrega (estado inicial do Firebase), mostra spinner
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100vw',
                    bgcolor: 'background.default'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Se não tem usuário, retorna null para não renderizar o Outlet (o useEffect vai redirecionar)
    if (!user) return null;

    // Se tem usuário, renderiza o painel
    return <Outlet />;
}