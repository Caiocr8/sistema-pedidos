'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/lib/api/firebase/config';
import { Box, Typography, AppBar, Toolbar, IconButton, Paper, useTheme, Container, CircularProgress } from '@mui/material';
import { LogOut } from 'lucide-react';
import Button from '@/app/components/ui/button';
// Importando o hook do store
import { useUserStore } from '@/app/store/user-store';

export default function DashboardPage() {
    const router = useRouter();
    // 1. Obtendo estado e ações do store
    const { user, isAuthReady, logout } = useUserStore();

    // 2. Lógica de Logout usando o store
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Chama a função de logout do store para limpar o estado
            logout();
            // Redireciona manualmente para garantir que a navegação ocorra rapidamente,
            // embora o useEffect de um AuthProvider (próximo passo) faria isso.
            router.push('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    // 3. Proteção de Rota/Estado de Carregamento
    if (!isAuthReady) {
        // Exibe um spinner enquanto o estado de autenticação inicial está sendo carregado
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (!user) {
        // Se o usuário não estiver autenticado, redireciona para o login
        router.replace('/login');
        return null; // Não renderiza nada enquanto redireciona
    }

    // Nome a ser exibido (usa o displayName, ou fallback para o email, ou "Usuário")
    const displayUserName = user.displayName || user.email || 'Usuário';

    return (
        <Box
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                // Removido 'minHeight: 100vh' pois o layout já preenche a tela
            }}
        >



            {/* Conteúdo Principal (Container) */}
            <Container
                maxWidth="md"
                sx={{
                    flex: 1, // Permite que o container ocupe o espaço restante verticalmente
                    py: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        p: { xs: 3, sm: 5 }, // Padding responsivo
                        mt: 4,
                        borderRadius: 3,
                        width: '100%',
                        maxWidth: 800,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: 'Caveat, cursive',
                            color: 'primary.dark',
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        Painel de Pedidos 🍽️
                    </Typography>

                    <Typography
                        sx={{
                            color: 'text.secondary',
                            mb: 3,
                        }}
                    >
                        Você está logado como **{displayUserName}**. Use este painel para gerenciar seus pedidos.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth={true}
                            // Exemplo de como você navegaria para uma rota de criação
                            onClick={() => router.push('/painel/pedidos/novo')}
                        >
                            Novo Pedido
                        </Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth={true}
                            // Exemplo de como você navegaria para uma rota de listagem
                            onClick={() => router.push('/painel/pedidos')}
                        >
                            Ver Pedidos
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
