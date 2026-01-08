import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Box, useTheme, IconButton } from '@mui/material';
import { Menu } from 'lucide-react'; // Import do ícone de Menu
import Sidebar from '@/components/layout/sidebar';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/painel')({
    component: PainelLayout,
});

function PainelLayout() {
    const theme = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Largura da sidebar no desktop
    const sidebarWidth = 280;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Componente de Sidebar (Navegação Lateral) */}
            <Sidebar
                width={sidebarWidth}
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Área Principal de Conteúdo */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    // No desktop desconta a sidebar, no mobile ocupa 100%
                    width: { sm: `calc(100% - ${sidebarWidth}px)` },
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    p: { xs: 2, md: 3 },
                }}
            >
                {/* BOTÃO MOBILE: Só aparece em telas pequenas (sm: 'none') */}
                <Box sx={{ display: { sm: 'none' }, mb: 1 }}>
                    <IconButton
                        color="inherit"
                        aria-label="abrir menu"
                        edge="start"
                        onClick={() => setSidebarOpen(true)}
                        sx={{
                            color: 'primary.main',
                            bgcolor: 'background.paper',
                            boxShadow: 1,
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <Menu size={24} />
                    </IconButton>
                </Box>

                {/* Conteúdo das Páginas (Dashboard, Pedidos, etc) */}
                <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto' }}>
                    {/* @ts-ignore - Passa o contexto caso alguma página filha precise forçar abertura */}
                    <Outlet context={{ setSidebarOpen }} />
                </Box>
            </Box>
        </Box>
    );
}