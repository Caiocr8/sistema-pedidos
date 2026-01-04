import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { AlertCircle } from 'lucide-react'

// 1. Componente Global de Loading (Performance Percebida)
// Aparece automaticamente se uma rota demorar para carregar (lazy loading)
const GlobalLoading = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100%',
            bgcolor: 'background.default'
        }}
    >
        <CircularProgress color="primary" size={40} />
    </Box>
)

// 2. Componente Global de Erro (Robustez)
// Captura erros que não foram tratados nas rotas individuais
const GlobalError = ({ error, reset }: { error: Error; reset: () => void }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.default'
        }}
    >
        <AlertCircle size={48} color="#d32f2f" style={{ marginBottom: 16 }} />
        <Typography variant="h5" gutterBottom color="error">
            Ops! Algo deu errado.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            {error.message || 'Ocorreu um erro inesperado ao carregar esta página.'}
        </Typography>
        <Button variant="contained" onClick={reset}>
            Tentar Novamente
        </Button>
    </Box>
)

// 3. Configuração da Instância do Router
export const router = createRouter({
    routeTree,

    // --- PERFORMANCE & UX ---

    // 'intent': Inicia o carregamento do código/dados assim que o usuário 
    // passa o mouse (hover) no link. Navegação parece instantânea.
    defaultPreload: 'intent',

    // Tempo (em ms) que o hover espera antes de disparar o preload (evita disparos acidentais)
    defaultPreloadDelay: 50,

    // Cache: Os dados da rota (loader) são considerados frescos por 5 segundos
    // Evita refetch desnecessário ao navegar rapidamente entre abas
    defaultStaleTime: 5000,

    // Componentes visuais padrão
    defaultPendingComponent: GlobalLoading,
    defaultErrorComponent: GlobalError,

    // Scroll Restoration: Volta para o topo ao navegar
    scrollRestoration: true,
})

// 4. Type Safety para toda a aplicação
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}