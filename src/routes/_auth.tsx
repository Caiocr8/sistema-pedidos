import { createFileRoute, Outlet, useRouter, useLocation } from '@tanstack/react-router';
import { useUserStore } from '@/store/user-store';
import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';

export const Route = createFileRoute('/_auth')({
    component: AuthLayout,
});

function AuthLayout() {
    const { user, isLoading } = useUserStore();
    const router = useRouter();
    const location = useLocation(); // Hook para pegar a URL atual

    useEffect(() => {
        if (!isLoading) {
            // 1. Verificação Básica: Se não estiver logado, vai para Login
            if (!user) {
                router.navigate({ to: '/login', replace: true });
                return;
            }

            // 2. Verificação de Role (Permissões)
            if (user.role === 'garcom') {
                // Lista de caminhos que o Garçom NÃO pode acessar
                const restrictedPaths = [
                    '/painel/dashboard',
                    '/painel/funcionarios',
                    '/painel/caixa'
                ];

                // Verifica se a URL atual começa com algum caminho proibido
                const isRestricted = restrictedPaths.some(path => location.pathname.startsWith(path));

                if (isRestricted) {
                    // Se tentar acessar, joga para a tela de pedidos
                    router.navigate({ to: '/painel/pedidos', replace: true });
                }
            }

            // (Opcional) Você pode adicionar regras para outros cargos aqui se precisar
        }
    }, [user, isLoading, router, location.pathname]);

    // Tela de Carregamento enquanto verifica a sessão
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Se não tiver usuário (e já passou do loading), não renderiza nada (o useEffect vai redirecionar)
    if (!user) return null;

    return <Outlet />;
}