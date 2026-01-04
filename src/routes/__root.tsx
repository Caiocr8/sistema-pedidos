// src/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import MuiProvider from '@/providers/mui-provider'
import AuthProvider from '@/providers/auth-provider'
import ThemeToggle from '@/components/layout/theme-toggle'
import NotFoundPage from '@/components/feedback/not-found'
import '@/globals.css'

export const Route = createRootRoute({
    component: RootLayout,
    notFoundComponent: NotFoundPage
})

function RootLayout() {
    return (
        <MuiProvider>
            <AuthProvider>
                <Box
                    component="main"
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 2,
                    }}
                >
                    <Outlet />
                </Box>

                <ThemeToggle />
            </AuthProvider>
        </MuiProvider>
    )
}
