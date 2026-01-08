import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';
import { useUserStore } from '@/store/user-store';
import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';

export const Route = createFileRoute('/_auth')({
    component: AuthLayout,
});

function AuthLayout() {
    const { user, isLoading } = useUserStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.navigate({ to: '/login', replace: true });
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return null;
    return <Outlet />;
}