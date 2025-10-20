'use client';

import { Box, Typography, Paper, Container } from '@mui/material';
import { LogIn, HelpCircle, UtensilsCrossed } from 'lucide-react';
import Button from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';

export default function HomePage() {
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
        backgroundImage: 'radial-gradient(circle, #F5DEB3 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: 6,
            borderRadius: 5,
            textAlign: 'center',
            bgcolor: '#FFF9F2',
            boxShadow: '0 12px 40px rgba(78,44,10,0.2)',
          }}
        >
          {/* Logo/Ícone */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 3,
              borderRadius: '50%',
              bgcolor: '#C68642',
              mb: 3,
              boxShadow: '0 4px 12px rgba(198,134,66,0.3)',
            }}
          >
            <UtensilsCrossed size={48} color="#FFF9F2" strokeWidth={2} />
          </Box>

          {/* Título */}
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Caveat", cursive',
              color: '#4E2C0A',
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
              color: '#8B5E3C',
              mb: 1,
              fontWeight: 500,
            }}
          >
            Bonitona das Tapiocas 
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#A67C52',
              mb: 5,
              maxWidth: 350,
              mx: 'auto',
            }}
          >
            Gestão completa para sua tapiocaria com sabor e praticidade
          </Typography>

          {/* Botões */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              color="warning"
              size="large"
              fullWidth
              onClick={() => router.push('/painel/login')}
              startIcon={<LogIn size={20} />}
              sx={{
                bgcolor: '#C68642',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': { 
                  bgcolor: '#A36A2F',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(198,134,66,0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Entrar no Sistema
            </Button>

            <Button
              variant="outlined"
              color="warning"
              size="large"
              fullWidth
              onClick={() => router.push('/ajuda')}
              startIcon={<HelpCircle size={20} />}
              sx={{
                borderColor: '#C68642',
                color: '#C68642',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#A36A2F',
                  bgcolor: 'rgba(198,134,66,0.08)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Preciso de Ajuda
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 4,
              color: '#A67C52',
            }}
          >
            © 2025 Maria Bonita • Feito com ❤️ e massa de tapioca
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}