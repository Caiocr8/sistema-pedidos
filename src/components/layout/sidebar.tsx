import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { Home, User, UtensilsCrossed, LogOut, Menu as MenuIcon, Bell, Settings } from 'lucide-react';
// 1. Importação correta do TanStack Router
import { Link, useRouter } from '@tanstack/react-router';
import { useUserStore } from '@/store/user-store';
import { auth } from '@/lib/api/firebase/config';
import { signOut } from 'firebase/auth';

const DRAWER_WIDTH = 240;

// 2. Rotas atualizadas (removido o '/app' e ajustado para a nova estrutura)
const menuItems = [
    { text: 'Início', icon: Home, href: '/painel/dashboard' },
    { text: 'Pedidos', icon: UtensilsCrossed, href: '/painel/pedidos' },
    { text: 'Cardápio', icon: MenuIcon, href: '/painel/cardapio' },
];

interface SidebarProps {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

export default function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps) {
    const theme = useTheme();
    const router = useRouter(); // Hook para navegação imperativa se necessário
    const userStore = useUserStore();

    const user = useUserStore((state) => state.user);
    const userName = user?.displayName || 'Usuário';
    const userEmail = user?.email || 'Sem e-mail';
    const userInitial = userName[0] || 'U';

    const handleLogout = async () => {
        try {
            await signOut(auth);
            userStore.logout(); // Limpa a store
            // Redireciona para login após sair
            router.navigate({ to: '/login' });
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.default,
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontFamily: 'Caveat, cursive', fontSize: '1.5rem' }}>
                        Maria Bonita
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Notificações">
                            <IconButton size="small">
                                <Badge badgeContent={3} color="error">
                                    <Bell size={18} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Configurações">
                            <IconButton size="small">
                                <Settings size={18} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'light'
                            ? 'rgba(198, 134, 66, 0.08)'
                            : 'rgba(230, 185, 128, 0.08)',
                        border: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                                fontWeight: 700,
                                fontSize: '1.1rem'
                            }}
                        >
                            {userInitial}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                                Olá, {userName}! 👋
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {userEmail}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Divider />

            <List sx={{ flexGrow: 1, px: 2, py: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                        {/* 3. Componente Link do TanStack Router */}
                        <Link
                            to={item.href}
                            style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}
                            // activeProps permite estilizar o link quando ele é a rota atual
                            activeProps={{
                                style: {
                                    fontWeight: 'bold',
                                    color: theme.palette.primary.main,
                                }
                            }}
                        >
                            {({ isActive }: { isActive: boolean }) => (
                                <ListItemButton
                                    selected={isActive} // Usa o estado do Link para marcar como selecionado no MUI
                                    sx={{
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            bgcolor: theme.palette.primary.main + '1A', // 10% de opacidade
                                            color: theme.palette.primary.main,
                                            '&:hover': {
                                                bgcolor: theme.palette.primary.main + '26',
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: theme.palette.action.hover,
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : undefined }}>
                                        <item.icon size={20} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
                                    />
                                </ListItemButton>
                            )}
                        </Link>
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ px: 2, pb: 2 }}>
                {/* Link para o Perfil atualizado */}
                <Link to="/painel/perfil" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {({ isActive }: { isActive: boolean }) => (
                        <ListItemButton
                            selected={isActive}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                border: 1,
                                borderColor: 'divider',
                                '&.Mui-selected': {
                                    bgcolor: theme.palette.primary.main + '1A',
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                },
                                '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : undefined }}>
                                <User size={20} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Meu Perfil"
                                primaryTypographyProps={{ fontWeight: 500 }}
                            />
                        </ListItemButton>
                    )}
                </Link>

                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'error.main',
                        '&:hover': {
                            bgcolor: theme.palette.error.light + '1A'
                        }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <LogOut size={20} color={theme.palette.error.main} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Sair"
                        primaryTypographyProps={{
                            color: 'error.main',
                            fontWeight: 600
                        }}
                    />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
        >
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: DRAWER_WIDTH,
                        borderRight: `1px solid ${theme.palette.divider}`
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}