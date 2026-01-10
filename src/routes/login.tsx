import { createFileRoute, useRouter, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, InputAdornment } from '@mui/material';
import { Mail, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import Button from '@/components/ui/button';
import IconButton from '@/components/ui/icon-button';
import Input from '@/components/forms/input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { fetchUserDataFromFirestore } from '@/lib/api/firebase/user'; // Importe a função de busca

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login, user, isAuthReady } = useUserStore();

    // Redirecionamento de segurança caso o usuário acesse /login já estando logado
    useEffect(() => {
        if (isAuthReady && user) {
            if (user.role === 'garcom') {
                router.navigate({ to: '/painel/pedidos' });
            } else {
                router.navigate({ to: '/painel/dashboard' });
            }
        }
    }, [isAuthReady, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Autentica no Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Busca manualmente os dados no Firestore para pegar o 'role'
            const firestoreData = await fetchUserDataFromFirestore(firebaseUser.uid);
            const role = firestoreData?.role || 'garcom'; // Define padrão se não encontrar

            // 3. Atualiza a Store manualmente com o ROLE correto
            login({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || firestoreData?.displayName,
                photoURL: firebaseUser.photoURL || firestoreData?.photoURL,
                role: role, // Aqui passamos o role explicitamente
            });

            // 4. Redireciona baseado no role recuperado agora
            if (role === 'garcom') {
                await router.navigate({ to: '/painel/pedidos' });
            } else {
                await router.navigate({ to: '/painel/dashboard' });
            }

        } catch (err: any) {
            console.error("Erro login:", err);
            let msg = "Erro ao fazer login.";

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = "E-mail ou senha incorretos.";
            } else if (err.code === 'auth/too-many-requests') {
                msg = "Muitas tentativas. Tente novamente mais tarde.";
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
            <Link to="/">
                <IconButton sx={{ position: 'fixed', top: 24, left: 24, zIndex: 10, bgcolor: 'background.paper' }}>
                    <ArrowLeft size={22} />
                </IconButton>
            </Link>

            <Grid container alignItems="center" justifyContent="center" sx={{ minHeight: '100vh', px: 2 }}>
                <Grid>
                    <Paper elevation={6} sx={{ p: 5, borderRadius: 3, width: '100%', maxWidth: 400, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontFamily: 'Caveat, cursive', mb: 1 }}>Maria Bonita</Typography>
                        <form onSubmit={handleLogin}>
                            <Input
                                label="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail size={18} />}
                                fullWidth
                                margin="normal"
                            />
                            <Input
                                label="Senha"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock size={18} />}
                                fullWidth
                                margin="normal"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}

                            <Button
                                type="submit"
                                variant="contained"
                                loading={loading}
                                disabled={loading || !!user}
                                fullWidth
                                sx={{ mt: 3 }}
                            >
                                {user ? "Entrando..." : "Entrar"}
                            </Button>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}