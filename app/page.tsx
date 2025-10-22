'use client';

import { useEffect } from 'react';
import { Box, Typography, Paper, Container, useTheme } from '@mui/material';
import { LogIn, HelpCircle, UtensilsCrossed } from 'lucide-react';
import Button from '@/app/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/app/store/user-store';

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isAuthReady } = useUserStore();

  // Redireciona usuário logado para o dashboard
  // IMPORTANTE: Só redireciona quando isAuthReady é true E user existe
  useEffect(() => {
    if (isAuthReady && user) {
      router.replace('/painel/app/dashboard');
    }
  }, [isAuthReady, user, router]);

  // IMPORTANTE: Não bloqueia renderização enquanto verifica auth
  // Só retorna null se já confirmou que user existe (evita flash)
  if (user && isAuthReady) {
    return null;
  }

  // Renderiza a Landing Page
  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: 5,
          textAlign: 'center',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[12],
        }}
      >
        {/* Logo/Ícone */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 3,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mb: 3,
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 12px rgba(198, 134, 66, 0.3)'
              : '0 4px 12px rgba(230, 185, 128, 0.3)',
          }}
        >
          <UtensilsCrossed
            size={48}
            color={theme.palette.primary.contrastText}
            strokeWidth={2}
          />
        </Box>

        {/* Título */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Caveat", cursive',
            color: 'text.primary',
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: '2.5rem', sm: '3rem' },
          }}
        >
          Maria Bonita
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            mb: 1,
            fontWeight: 500,
          }}
        >
          Bonitona das Tapiocas
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 5,
            maxWidth: 350,
            mx: 'auto',
          }}
        >
          Gestão completa para sua tapiocaria com sabor e praticidade
        </Typography>

        {/* Botões */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link href="/login" passHref >

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<LogIn size={20} />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Entrar no Sistema
            </Button>

          </Link>

          <Link href="/painel/ajuda" passHref >

            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              startIcon={<HelpCircle size={20} />}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Preciso de Ajuda
            </Button>

          </Link>
        </Box>

        {/* Rodapé */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 4,
            color: 'text.secondary',
          }}
        >
          &copy; 2025 Maria Bonita &bull; Feito com ❤️ e massa de tapioca
        </Typography>
      </Paper>
    </Container>
  );
}