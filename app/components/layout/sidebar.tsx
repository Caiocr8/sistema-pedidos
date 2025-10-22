import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Avatar, useTheme, IconButton, Tooltip, Badge } from '@mui/material';
import { Home, User, ShoppingCart, UtensilsCrossed, LogOut, Menu as MenuIcon, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/app/store/user-store';
import { auth } from '@/app/lib/api/firebase/config';
import { signOut } from 'firebase/auth';

// Largura da barra lateral em desktop
const DRAWER_WIDTH = 240;

// Definição dos itens de navegação
const menuItems = [
    { text: 'Início', icon: Home, href: '/painel/dashboard' },
    { text: 'Novo Pedido', icon: ShoppingCart, href: '/painel/novo-pedido' },
    { text: 'Pedidos', icon: UtensilsCrossed, href: '/painel/pedidos' },
    { text: 'Cardápio', icon: MenuIcon, href: '/painel/cardapio' },
];

interface SidebarProps {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

export default function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps) {
    const theme = useTheme();
    const userStore = useUserStore();

    // Dados do usuário
    const user = userStore.user;
    const userName = user?.displayName || 'Usuário';
    const userEmail = user?.email || 'Sem e-mail';
    const userInitial = userName[0] || 'U';

    // Handler para Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("Usuário deslogado com sucesso.");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // Conteúdo do Drawer (barra lateral)
    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.default,
            }}
        >
            {/* Header com Logo e Ações */}
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

                {/* Informações do Usuário */}
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

            {/* Itens de Navegação Principal */}
            <List sx={{ flexGrow: 1, px: 2, py: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                        <Link href={item.href} passHref style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
                            <ListItemButton
                                sx={{
                                    borderRadius: 2,
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === 'light'
                                            ? 'rgba(198, 134, 66, 0.08)'
                                            : 'rgba(230, 185, 128, 0.08)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <item.icon size={20} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                            </ListItemButton>
                        </Link>
                    </ListItem>
                ))}
            </List>

            {/* Ações do Usuário (Sempre no fundo) */}
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ px: 2, pb: 2 }}>
                {/* Meu Perfil */}
                <Link href="/painel/perfil" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemButton
                        sx={{
                            borderRadius: 2,
                            mb: 1,
                            border: 1,
                            borderColor: 'divider',
                            '&:hover': {
                                bgcolor: theme.palette.mode === 'light'
                                    ? 'rgba(198, 134, 66, 0.08)'
                                    : 'rgba(230, 185, 128, 0.08)',
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <User size={20} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Meu Perfil"
                            primaryTypographyProps={{ fontWeight: 500 }}
                        />
                    </ListItemButton>
                </Link>

                {/* Logout */}
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
            {/* Versão Mobile (temporária) */}
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

            {/* Versão Desktop (permanente) */}
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