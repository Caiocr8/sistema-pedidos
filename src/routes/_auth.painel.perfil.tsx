import { createFileRoute } from '@tanstack/react-router';
import { Box, Typography, Paper, Avatar, Divider, Stack } from '@mui/material';
import { useUserStore } from '@/store/user-store';
import { User, Mail, Shield } from 'lucide-react';

export const Route = createFileRoute('/_auth/painel/perfil')({
    component: PerfilPage,
})

function PerfilPage() {
    const { user } = useUserStore();

    if (!user) return null;

    return (
        <Box maxWidth="md" mx="auto">
            <Typography variant="h4" fontWeight={700} mb={3}>Meu Perfil</Typography>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                <Box display="flex" alignItems="center" gap={3} mb={4}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                        {user.displayName?.[0] || user.email[0].toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={600}>{user.displayName || 'Usuário'}</Typography>
                        <Typography color="text.secondary">Conta ativa</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={3}>
                    <Box display="flex" gap={2}>
                        <Mail color="#C68642" />
                        <Box>
                            <Typography variant="caption" color="text.secondary">E-mail</Typography>
                            <Typography>{user.email}</Typography>
                        </Box>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Shield color="#C68642" />
                        <Box>
                            <Typography variant="caption" color="text.secondary">Função</Typography>
                            <Typography sx={{ textTransform: 'capitalize' }}>{user.role || 'Usuário'}</Typography>
                        </Box>
                    </Box>
                    <Box display="flex" gap={2}>
                        <User color="#C68642" />
                        <Box>
                            <Typography variant="caption" color="text.secondary">UID</Typography>
                            <Typography variant="body2" fontFamily="monospace">{user.uid}</Typography>
                        </Box>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
}