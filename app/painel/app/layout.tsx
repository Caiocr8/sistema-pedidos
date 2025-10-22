'use client';

import React, { useState } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery, IconButton, AppBar, Typography } from '@mui/material';
import { Menu as MenuIcon } from 'lucide-react';
import Sidebar from '@/app/components/layout/sidebar';
import ProtectedRoute from '@/app/components/auth/protected-routes';

const DRAWER_WIDTH = 240;

export default function PainelLayout({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <ProtectedRoute>
            <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
                <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                        ml: { sm: `${DRAWER_WIDTH}px` },
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {
                        !isDesktop && (

                            <Toolbar>
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    edge="start"
                                    onClick={handleDrawerToggle}
                                    sx={{ mr: 2 }}
                                >
                                    <MenuIcon />
                                </IconButton>

                            </Toolbar>

                        )
                    }


                    {/* Conteúdo dinâmico */}
                    <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>{children}</Box>
                </Box>
            </Box>
        </ProtectedRoute>
    );
}
