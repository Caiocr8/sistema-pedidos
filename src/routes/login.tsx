import { createFileRoute, useRouter, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, InputAdornment } from '@mui/material';
import { Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/button';
import IconButton from '@/components/ui/icon-button';
import Input from '@/components/forms/input';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';

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

    const { user, isAuthReady } = useUserStore();

    // Lógica de Redirecionamento Inteligente
    useEffect(() => {
        if (isAuthReady && user) {
            // Se for Garçom -> Pedidos
            if (user.role === 'garcom') {
                router.navigate({ to: '/painel/pedidos' });
            } else {
                // Admin ou Caixa -> Dashboard
                router.navigate({ to: '/painel/dashboard' });
            }
        }
    }, [isAuthReady, user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Apenas autentica no Firebase. 
            // O AuthProvider vai detectar o login, buscar a role (garcom/admin) 
            // e atualizar o userStore, disparando o useEffect acima.
            await signInWithEmailAndPassword(auth, email, password);

            // Não navegamos manualmente aqui para evitar redirecionar antes de saber o cargo
        } catch (err: any) {
            setError("Erro ao fazer login. Verifique suas credenciais.");
            setLoading(false); // Só para o loading se der erro
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
                            <Input label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} fullWidth margin="normal" />
                            <Input label="Senha" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal"
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
                            <Button type="submit" variant="contained" loading={loading} fullWidth sx={{ mt: 3 }}>Entrar</Button>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}