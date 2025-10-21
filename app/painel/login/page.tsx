// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, InputAdornment } from '@mui/material';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '@/app/components/ui/button';
import IconButton from '@/app/components/ui/icon-button';
import Input from '@/app/components/forms/input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/lib/api/firebase/config';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/painel/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Botão Voltar */}
      <IconButton
        onClick={() => router.push('/')}
        aria-label="voltar"
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
        }}
      >
        <ArrowLeft size={24} />
      </IconButton>

      <Paper
        elevation={6}
        sx={{
          p: 5,
          borderRadius: 3,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          bgcolor: '#FFF9F2',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'Caveat, cursive',
            color: '#4E2C0A',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Maria Bonita
        </Typography>

        <Typography variant="subtitle1" sx={{ color: '#8B5E3C', mb: 4 }}>
          Bonitona das Tapiocas
        </Typography>

        <form onSubmit={handleLogin}>
          <Input
            label="E-mail"
            type="email"
            value={email}
            fullWidth={true}
            margin="normal"
            onChange={(e) => setEmail(e.target.value)}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="#8B5E3C" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            fullWidth={true}
            margin="normal"
            onChange={(e) => setPassword(e.target.value)}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} color="#8B5E3C" />
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
            color="warning"
            loading={loading}
            fullWidth
            sx={{
              mt: 3,
              bgcolor: '#C68642',
              '&:hover': { bgcolor: '#A36A2F' },
            }}
          >
            Entrar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}