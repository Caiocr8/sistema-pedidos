import { Link } from '@tanstack/react-router'
import { Box, Container, Typography } from '@mui/material'
import { Home, HelpCircle } from 'lucide-react'
import Button from '@/components/ui/button'
import { useUserStore } from '@/store/user-store'

export default function NotFoundPage() {
    const { user, isAuthReady } = useUserStore()

    // Opcional: Se não estiver pronto, pode retornar null ou um spinner simples
    if (!isAuthReady) return null;

    const targetPath = user ? '/painel/dashboard' : '/'

    return (
        <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
            <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                <Typography variant="h1" color="primary.main" fontWeight={700}>
                    404
                </Typography>

                <Typography variant="h5" mb={4}>Página não encontrada</Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                    <Link to={targetPath} style={{ textDecoration: 'none' }}>
                        <Button fullWidth startIcon={<Home size={20} />}>
                            Voltar ao Início
                        </Button>
                    </Link>

                    {!user && (
                        <Link to="/ajuda" style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" fullWidth startIcon={<HelpCircle size={20} />}>
                                Preciso de Ajuda
                            </Button>
                        </Link>
                    )}
                </Box>
            </Container>
        </Box>
    )
}