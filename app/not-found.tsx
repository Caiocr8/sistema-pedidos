'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/app/components/ui/button'; // ajuste o caminho se necessário
import { Box, Typography, Container } from '@mui/material';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FAEBD7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          position: 'absolute',
          top: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Caveat, cursive',
          fontWeight: 700,
          color: '#4E2C0A',
        }}
      >
        Maria Bonita
      </Typography>

      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '5rem', md: '7rem' },
            fontWeight: 800,
            color: '#8B4513',
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#5C4033',
            mb: 2,
          }}
        >
          Página não encontrada
        </Typography>

        <Typography
          sx={{
            color: '#7A5542',
            mb: 4,
          }}
        >
          Ops! Parece que essa tapioca não está no cardápio. <br />
          A página que você procura pode ter sido movida ou removida.
        </Typography>

        {/* Ações */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Link href="/" passHref>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Home size={18} />}
              sx={{
                bgcolor: '#C68642',
                '&:hover': { bgcolor: '#A36A2F' },
              }}
            >
              Voltar para o Início
            </Button>
          </Link>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => window.history.back()}
            sx={{
              borderColor: '#A36A2F',
              color: '#A36A2F',
              '&:hover': {
                bgcolor: '#F5DEB3',
                borderColor: '#A36A2F',
              },
            }}
          >
            Voltar
          </Button>
        </Box>
      </Container>

      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          bottom: 12,
          color: '#8B5E3C',
        }}
      >
        © {new Date().getFullYear()} Maria Bonita — Bonitona das Tapiocas
      </Typography>
    </Box>
  );
}
