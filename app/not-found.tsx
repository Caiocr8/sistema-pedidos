// app/not-found.tsx
'use client';

import { Box, Container, Typography } from '@mui/material';
import { Home, HelpCircle } from 'lucide-react';
import Button from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FAEBD7',
        px: 2,
        position: 'relative',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          {/* 404 */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem' },
              fontWeight: 700,
              color: '#C68642',
              mb: 2,
              lineHeight: 1,
            }}
          >
            404
          </Typography>

          {/* Título */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#4E2C0A',
              mb: 2,
            }}
          >
            Página não encontrada
          </Typography>

          {/* Descrição */}
          <Typography
            sx={{
              color: '#7A5C40',
              mb: 5,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            Parece que você se perdeu nas tapiocas! A página que você procura não existe ou foi removida.
          </Typography>

          {/* Botões */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>

            <Link href="/">
              <Button
                variant="contained"
                color="warning"
                fullWidth
                startIcon={<Home size={20} />}
                sx={{
                  bgcolor: '#C68642',
                  '&:hover': { bgcolor: '#A36A2F' },
                }}
              >
                Voltar para Início
              </Button>
            </Link>

            <Link href="/painel/ajuda">
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={() => router.push('/ajuda')}
                startIcon={<HelpCircle size={20} />}
                sx={{
                  borderColor: '#C68642',
                  color: '#C68642',
                  '&:hover': {
                    borderColor: '#A36A2F',
                    bgcolor: 'rgba(198,134,66,0.08)',
                  },
                }}
              >
                Preciso de Ajuda
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#8B5E3C',
        }}
      >
        &copy; 2025 Maria Bonita
      </Typography>
    </Box>
  );
}