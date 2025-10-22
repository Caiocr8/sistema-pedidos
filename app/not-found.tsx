'use client';

import { Box, Container, Typography, useTheme } from '@mui/material';
import { Home, HelpCircle } from 'lucide-react';
import Button from '@/app/components/ui/button';
import Link from 'next/link';
import { useUserStore } from '@/app/store/user-store';

export default function NotFound() {
  const theme = useTheme();
  const { user, isAuthReady } = useUserStore();

  const targetPath = user ? '/painel/app/dashboard' : '/';
  const buttonText = user ? 'Voltar para Dashboard' : 'Voltar para Início';

  if (!isAuthReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh' }}>
        <Typography>Verificando estado de login...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column', // ✅ Coluna principal
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh', // ✅ Garante altura total da viewport
        px: 2,
        width: '100%',
        position: 'relative',
      }}
    >
      <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem' },
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
              lineHeight: 1,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Página não encontrada
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              mb: 5,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            Parece que você se perdeu nas tapiocas! A página que você procura não existe ou foi removida.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
            <Link href={targetPath} passHref>
              <Button variant="contained" color="primary" fullWidth startIcon={<Home size={20} />}>
                {buttonText}
              </Button>
            </Link>

            {!user && (
              <Link href="/painel/ajuda" passHref>
                <Button variant="outlined" color="primary" fullWidth startIcon={<HelpCircle size={20} />}>
                  Preciso de Ajuda
                </Button>
              </Link>
            )}
          </Box>
        </Box>
      </Container>

      {/* ✅ Rodapé fixado ao final da página */}
      <Typography
        variant="body2"
        sx={{
          mt: 'auto', // Empurra pro final
          mb: 2,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        &copy; 2025 Maria Bonita
      </Typography>
    </Box>
  );
}
