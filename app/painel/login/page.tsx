'use client';

import { useState } from 'react';
import { Box, Typography, Paper, InputAdornment } from '@mui/material';
import { Lock, Mail } from 'lucide-react';
import Button from '@/app/components/ui/button'; // ✅ padronizado com @
import Input from '@/app/components/forms/input'; // ✅ usa seu input customizado

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1500));

    alert(`Bem-vindo, ${email || 'usuário'}!`);
    setLoading(false);
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
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 5,
          borderRadius: 4,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          bgcolor: '#FFF9F2',
          boxShadow: '0 8px 24px rgba(78,44,10,0.15)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Caveat", cursive',
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
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={18} />
                </InputAdornment>
              ),
            }}
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={18} />
                </InputAdornment>
              ),
            }}
          />

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
