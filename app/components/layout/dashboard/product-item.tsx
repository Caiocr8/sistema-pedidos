// app/components/dashboard/product-item.tsx
'use client';

import { Box, Avatar, Typography, Chip, LinearProgress } from '@mui/material';

interface ProductItemProps {
    rank: number;
    name: string;
    sales: number;
    revenue: number;
    percentage: number;
    trend: string;
}

export default function ProductItem({
    rank,
    name,
    sales,
    revenue,
    percentage,
    trend,
}: ProductItemProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                        }}
                    >
                        {rank}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {sales} vendas • R$ {revenue.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
                <Chip label={trend} size="small" color="success" sx={{ fontWeight: 600 }} />
            </Box>
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                    },
                }}
            />
        </Box>
    );
}