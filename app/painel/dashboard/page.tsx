'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/app/lib/api/firebase/config';
import { Box, Typography, AppBar, Toolbar, IconButton, Paper } from '@mui/material';
import { LogOut } from 'lucide-react';
import Button from '@/app/components/ui/button';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) router.push('/painel/login');
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#FAEBD7',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <AppBar
                position="static"
                sx={{
                    bgcolor: '#C68642',
                    boxShadow: 'none',
                }}
            >
                <Toolbar
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontFamily: 'Caveat, cursive',
                            color: '#FFF9F2',
                            fontWeight: 700,
                        }}
                    >
                        Maria Bonita
                    </Typography>

                    <IconButton
                        color="inherit"
                        onClick={handleLogout}
                        title="Sair"
                        sx={{
                            color: '#FFF9F2',
                            '&:hover': { color: '#4E2C0A' },
                        }}
                    >
                        <LogOut size={22} />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Conteúdo */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    p: 4,
                }}
            >
                <Paper
                    elevation={4}
                    sx={{
                        p: 5,
                        mt: 4,
                        borderRadius: 3,
                        width: '100%',
                        maxWidth: 800,
                        bgcolor: '#FFF9F2',
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: 'Caveat, cursive',
                            color: '#4E2C0A',
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        Painel de Pedidos 🍽️
                    </Typography>

                    <Typography
                        sx={{
                            color: '#8B5E3C',
                            mb: 3,
                        }}
                    >
                        Bem-vindo(a) ao sistema interno, Maria Bonita!
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="warning"
                            sx={{
                                bgcolor: '#C68642',
                                '&:hover': { bgcolor: '#A36A2F' },
                            }}
                        >
                            Novo Pedido
                        </Button>

                        <Button
                            variant="outlined"
                            color="inherit"
                            sx={{
                                borderColor: '#C68642',
                                color: '#4E2C0A',
                                '&:hover': {
                                    bgcolor: '#F5E3C0',
                                    borderColor: '#A36A2F',
                                },
                            }}
                        >
                            Ver Pedidos
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
