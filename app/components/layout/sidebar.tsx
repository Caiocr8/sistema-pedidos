import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Avatar, useTheme, useMediaQuery } from '@mui/material';
import { Home, User, ShoppingCart, UtensilsCrossed, LogOut, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/app/store/user-store';
import { auth } from '@/app/lib/api/firebase/config';
import { signOut } from 'firebase/auth';

// Largura da barra lateral em desktop
const DRAWER_WIDTH = 240;

// Definição dos itens de navegação
const menuItems = [
    { text: 'Início', icon: Home, href: '/painel/app/dashboard' },
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
    // Usamos o useMediaQuery para verificar se estamos em telas maiores que 'sm' (desktop)
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
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
            // O listener onAuthStateChanged no AuthProvider cuidará do 'logout()' no store.
            console.log("Usuário deslogado com sucesso.");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // Conteúdo do Drawer (barra lateral)
    const drawerContent = (
        <Box
            sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.default,
            }}
        >
            {/* Título / Logo */}
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                    Maria Bonita
                </Typography>
            </Box>
            <Divider />

            {/* Itens de Navegação Principal */}
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <Link href={item.href} passHref style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <item.icon size={20} />
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </Link>
                    </ListItem>
                ))}
            </List>

            {/* Informações e Ações do Usuário (Sempre no fundo) */}
            <Divider sx={{ my: 1 }} />

            {/* Meu Perfil */}
            <Link href="/painel/perfil" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemButton sx={{ borderRadius: 2, mb: 1 }}>
                    <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            {userInitial}
                        </Avatar>
                    </ListItemIcon>
                    <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <Typography variant="subtitle2" fontWeight={600}>{userName}</Typography>
                        <Typography variant="caption" color="text.secondary">{userEmail}</Typography>
                    </Box>
                </ListItemButton>
            </Link>

            {/* Logout */}
            <ListItem disablePadding>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, '&:hover': { bgcolor: theme.palette.error.light + '1A' } }}>
                    <ListItemIcon>
                        <LogOut size={20} color={theme.palette.error.main} />
                    </ListItemIcon>
                    <ListItemText primary="Sair (Logout)" primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }} />
                </ListItemButton>
            </ListItem>
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
                ModalProps={{ keepMounted: true }} // Melhor performance em mobile
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
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: `1px solid ${theme.palette.divider}` },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
