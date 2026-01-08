import React, { useMemo } from 'react';
import {
    Drawer, Box, Typography, Divider, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Avatar, IconButton, Badge, Tooltip, useTheme, alpha
} from '@mui/material';
import { Home, User, UtensilsCrossed, LogOut, Menu as MenuIcon, Bell, Settings, Users } from 'lucide-react';
import { Link, useRouter } from '@tanstack/react-router';
import { useUserStore } from '@/store/user-store';
import { auth } from '@/lib/api/firebase/config';
import { signOut } from 'firebase/auth';

// Itens base visíveis para todos os usuários
const BASE_MENU_ITEMS = [
    { text: 'Início', icon: Home, href: '/painel/dashboard' },
    { text: 'Pedidos', icon: UtensilsCrossed, href: '/painel/pedidos' },
    { text: 'Cardápio', icon: MenuIcon, href: '/painel/cardapio' },
];

interface SidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
    width?: number;
}

export default function Sidebar({ mobileOpen, onClose, width = 280 }: SidebarProps) {
    const theme = useTheme();
    const router = useRouter();
    const { user, logout } = useUserStore();

    // 1. Constrói o menu baseado no cargo (role) do usuário
    const menuItems = useMemo(() => {
        const items = [...BASE_MENU_ITEMS];
        // Adiciona gestão de equipe apenas para admins
        if (user?.role === 'admin') {
            items.push({ text: 'Equipe', icon: Users, href: '/painel/funcionarios' });
        }
        return items;
    }, [user]);

    // Dados do usuário para exibição no cabeçalho
    const userData = useMemo(() => ({
        name: user?.displayName || 'Usuário',
        email: user?.email || 'Sem e-mail',
        initial: (user?.displayName?.[0] || 'U').toUpperCase()
    }), [user]);

    // Função de Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            logout();
            router.navigate({ to: '/login' });
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    // 2. Gerador de Estilos Padronizados (Design System)
    // Garante que todos os botões (menu e perfil) tenham o mesmo visual "profissional"
    const getListItemStyles = (isActive: boolean, isError = false) => {
        const activeColor = isError ? theme.palette.error.main : theme.palette.primary.main;
        const activeBg = isError ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.1);
        const hoverBg = isError ? alpha(theme.palette.error.main, 0.15) : alpha(theme.palette.primary.main, 0.15);

        return {
            borderRadius: 2,
            mb: 1,
            py: 1.5,
            color: isActive ? activeColor : theme.palette.text.primary,
            bgcolor: isActive ? activeBg : 'transparent',
            transition: 'all 0.2s ease-in-out',
            // Estilo quando selecionado (MUI)
            '&.Mui-selected': {
                bgcolor: activeBg,
                color: activeColor,
                '&:hover': { bgcolor: hoverBg },
                '& .MuiListItemIcon-root': { color: activeColor },
            },
            // Estilo de Hover
            '&:hover': {
                bgcolor: isActive ? hoverBg : theme.palette.action.hover,
                transform: 'translateX(4px)', // Efeito sutil de movimento
            },
            // Ícone
            '& .MuiListItemIcon-root': {
                minWidth: 40,
                color: isActive ? activeColor : theme.palette.text.secondary,
                transition: 'color 0.2s',
            }
        };
    };

    // Conteúdo interno do Drawer (extraído para evitar duplicação)
    const DrawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {/* Cabeçalho / Perfil */}
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontFamily: 'Caveat, cursive', fontWeight: 700, color: 'primary.main' }}>
                        Maria Bonita
                    </Typography>
                    {/* Ações Rápidas (Notificação/Config) */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Notificações">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                <Badge badgeContent={3} color="error" variant="dot"><Bell size={18} /></Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Configurações">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                <Settings size={18} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Card do Usuário */}
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.08), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 42, height: 42, bgcolor: 'primary.main', fontWeight: 700, fontSize: '1.1rem', boxShadow: 2 }}>
                            {userData.initial}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>Olá, {userData.name.split(' ')[0]}!</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{userData.email}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Menu Principal */}
            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.href} disablePadding>
                        <Link to={item.href} style={{ width: '100%', textDecoration: 'none' }}>
                            {({ isActive }) => (
                                <ListItemButton
                                    selected={isActive}
                                    onClick={onClose} // Fecha menu mobile ao navegar
                                    sx={getListItemStyles(isActive)}
                                >
                                    <ListItemIcon><item.icon size={22} /></ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}
                                    />
                                </ListItemButton>
                            )}
                        </Link>
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Rodapé (Perfil e Sair) */}
            <Box sx={{ p: 2 }}>
                <Link to="/painel/perfil" style={{ textDecoration: 'none' }}>
                    {({ isActive }) => (
                        <ListItemButton
                            selected={isActive}
                            onClick={onClose}
                            sx={getListItemStyles(isActive)}
                        >
                            <ListItemIcon><User size={20} /></ListItemIcon>
                            <ListItemText primary="Meu Perfil" primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }} />
                        </ListItemButton>
                    )}
                </Link>

                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        ...getListItemStyles(false, true), // Usa estilo "erro" (vermelho)
                        color: 'error.main',
                        '& .MuiListItemIcon-root': { color: 'error.main' },
                    }}
                >
                    <ListItemIcon><LogOut size={20} /></ListItemIcon>
                    <ListItemText primary="Sair" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: width }, flexShrink: { sm: 0 } }}
            aria-label="menu lateral"
        >
            {/* Drawer Mobile (Temporário) */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: width, borderRight: 'none', boxShadow: 4 }
                }}
            >
                {DrawerContent}
            </Drawer>

            {/* Drawer Desktop (Permanente) */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: width, borderRight: `1px dashed ${theme.palette.divider}`, bgcolor: 'background.paper' }
                }}
                open
            >
                {DrawerContent}
            </Drawer>
        </Box>
    );
}