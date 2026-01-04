import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useUserStore } from '@/store/user-store'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export const Route = createFileRoute('/_auth')({
    // 1. Proteção Lógica (Executa antes de renderizar)
    beforeLoad: ({ location }) => {
        const { isAuthReady, user } = useUserStore.getState()

        // Se o Firebase já carregou e não tem usuário, redireciona para login
        if (isAuthReady && !user) {
            throw redirect({
                to: '/login',
                search: {
                    // Salva onde o usuário tentou ir para redirecionar de volta depois
                    redirect: location.href,
                },
            })
        }
    },
    component: AuthLayout,
})

function AuthLayout() {
    const { isAuthReady, user } = useUserStore()

    // 2. Feedback Visual (Enquanto o Firebase inicializa)
    if (!isAuthReady) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100%',
                    bgcolor: 'background.default' // Usa a cor do tema
                }}
            >
                <CircularProgress color="primary" size={48} />
            </Box>
        )
    }

    // Se passou pelo beforeLoad mas por algum motivo o user ainda é null (raro), não renderiza nada
    if (!user) return null

    // Renderiza as rotas filhas (Painel, Dashboard, etc)
    return <Outlet />
} 