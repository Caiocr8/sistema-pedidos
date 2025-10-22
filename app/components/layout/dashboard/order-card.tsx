// app/components/dashboard/order-card.tsx
'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';

interface OrderCardProps {
    id: string;
    customer: string;
    items: string;
    value: number;
    status: 'completed' | 'preparing' | 'pending';
    time: string;
}

const statusLabels = {
    completed: 'Concluído',
    preparing: 'Preparando',
    pending: 'Pendente',
};

const statusColors = {
    completed: 'success' as const,
    preparing: 'warning' as const,
    pending: 'default' as const,
};

export default function OrderCard({ id, customer, items, value, status, time }: OrderCardProps) {
    return (
        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {id}
                    </Typography>
                    <Chip
                        label={statusLabels[status]}
                        size="small"
                        color={statusColors[status]}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {customer}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {items}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        R$ {value.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        há {time}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}