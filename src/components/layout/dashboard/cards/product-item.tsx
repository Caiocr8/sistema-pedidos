'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

export interface ProductItemProps {
    id?: number;
    rank: number;
    name: string;
    sales: string | number;
    revenue: string | number;
    percentage?: number;
    trend?: string | number;
}

const ProductItem = React.memo(function ProductItem({ rank, name, sales, revenue, percentage, trend }: ProductItemProps) {
    const trendVal = Number(trend);
    const trendLabel = trendVal > 0 ? `+${trendVal}` : trendVal === 0 ? '=' : `${trendVal}`;
    const trendColor = trendVal > 0 ? 'success' : trendVal < 0 ? 'error' : 'default';

    return (
        <Box sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: percentage ? 1 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
                    <Avatar
                        sx={{
                            width: 24,
                            height: 24,
                            bgcolor: rank <= 3 ? 'primary.main' : 'action.disabled',
                            fontSize: '0.75rem',
                            fontWeight: 800
                        }}
                    >
                        {rank}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {sales} vendas • {revenue}
                        </Typography>
                    </Box>
                </Box>
                {trend !== undefined && (
                    <Chip
                        label={trendLabel}
                        size="small"
                        color={trendColor}
                        variant="outlined"
                        sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', ml: 1 }}
                    />
                )}
            </Box>
            {percentage !== undefined && (
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: rank <= 3 ? 'primary.main' : 'grey.500' }
                    }}
                />
            )}
        </Box>
    );
});

export default ProductItem;