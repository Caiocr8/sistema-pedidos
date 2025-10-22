'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, InputAdornment, Grid } from '@mui/material';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '@/app/components/ui/button';
import IconButton from '@/app/components/ui/icon-button';
import Input from '@/app/components/forms/input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/lib/api/firebase/config';
import Link from 'next/link';
import { useUserStore } from '@/app/store/user-store';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, user, isAuthReady } = useUserStore();

  useEffect(() => {
    if (isAuthReady && user) {
      router.replace('/painel/app/dashboard');
    }
  }, [isAuthReady, user, router]);

  if (user && isAuthReady) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      login({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
      });

      router.push('/painel/app/dashboard');
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro desconhecido. Tente novamente.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'E-mail ou senha incorretos. Tente novamente.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Formato de e-mail inválido.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Botão Voltar (fora da centralização) */}
      <Link href="/" passHref>
        <IconButton
          aria-label="voltar"
          sx={{
            position: 'fixed',
            top: 24,
            left: 24,
            color: 'text.secondary',
            zIndex: 10,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <ArrowLeft size={22} />
        </IconButton>
      </Link>

      {/* Conteúdo centralizado */}
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: '100vh',
          px: 2,
        }}
      >
        <Grid>
          <Paper
            elevation={6}
            sx={{
              p: 5,
              borderRadius: 3,
              width: '100%',
              maxWidth: 400,
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Caveat, cursive',
                color: 'text.primary',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Maria Bonita
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{
                color: 'secondary.main',
                mb: 4,
              }}
            >
              Bonitona das Tapiocas
            </Typography>

            <form onSubmit={handleLogin}>
              <Input
                label="E-mail"
                type="email"
                value={email}
                fullWidth
                margin="normal"
                onChange={(e) => setEmail(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'secondary.main' }}>
                        <Mail size={18} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                fullWidth
                margin="normal"
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'secondary.main' }}>
                        <Lock size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1, mb: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                loading={loading}
                fullWidth
                sx={{ mt: 3 }}
              >
                Entrar
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
