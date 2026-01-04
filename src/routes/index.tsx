import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Box, Typography, Paper, Container, useTheme, CircularProgress } from '@mui/material';
import { LogIn, HelpCircle, UtensilsCrossed } from 'lucide-react';
import Button from '@/components/ui/button';
import { useUserStore } from '@/store/user-store';

export const Route = createFileRoute('/')({
    component: HomePage,
})

function HomePage() {
    const router = useRouter();
    const theme = useTheme();
    const { user, isAuthReady } = useUserStore();

    useEffect(() => {
        // Tenta redirecionar para o painel se já estiver logado
        if (isAuthReady && user) {
            router.navigate({ to: '/painel/dashboard' });
        }
    }, [isAuthReady, user, router]);

    // --- CORREÇÃO: Mostra um Loading em vez de tela branca ---
    if (isAuthReady && user) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
            }}>
                <CircularProgress size={60} thickness={4} color="primary" />
                <Typography variant="h6" color="text.secondary" sx={{ fontFamily: 'Caveat, cursive' }}>
                    Entrando na cozinha...
                </Typography>
            </Box>
        );
    }
    // ---------------------------------------------------------

    return (
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', py: 4 }}>
            <Paper elevation={12} sx={{ p: { xs: 4, sm: 6 }, borderRadius: 5, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: 'primary.main', mb: 3 }}>
                    <UtensilsCrossed size={48} color={theme.palette.primary.contrastText} strokeWidth={2} />
                </Box>
                <Typography variant="h3" sx={{ fontFamily: '"Roboto", cursive', fontWeight: 700, mb: 1 }}>
                    Maria Bonita
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Bonitona das Tapiocas
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" fullWidth startIcon={<LogIn size={20} />}>
                            Entrar no Sistema
                        </Button>
                    </Link>

                    <Link to="/ajuda" style={{ textDecoration: 'none' }}>
                        <Button variant="outlined" fullWidth startIcon={<HelpCircle size={20} />}>
                            Preciso de Ajuda
                        </Button>
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
}