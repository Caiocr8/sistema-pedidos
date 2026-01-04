import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useState } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery, IconButton } from '@mui/material';
import { Menu as MenuIcon } from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';

export const Route = createFileRoute('/_auth/painel')({
    component: PainelLayout,
})

function PainelLayout() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const DRAWER_WIDTH = 240;

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

            <Box component="main" sx={{
                flexGrow: 1,
                width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                ml: { sm: `${DRAWER_WIDTH}px` },
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh'
            }}>
                {!isDesktop && (
                    <Toolbar>
                        <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                )}

                {/* Aqui serão renderizados o Dashboard, Pedidos, etc */}
                <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}