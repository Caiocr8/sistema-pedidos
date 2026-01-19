'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@/components/ui/card';

export type OrderStatus = 'pendente' | 'em_preparo' | 'a_caminho' | 'entregue' | 'cancelado';

export interface OrderCardProps {
    id: string;
    customer: string; // ou "Mesa X"
    items: string; // ou "Total: R$ ..."
    value: number;
    status: OrderStatus;
    time: string;
}

const statusLabels: Record<OrderStatus, string> = {
    pendente: 'Pendente',
    em_preparo: 'Preparando',
    a_caminho: 'A Caminho',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
};

const statusColors: Record<OrderStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    pendente: 'default',
    em_preparo: 'warning',
    a_caminho: 'info',
    entregue: 'success',
    cancelado: 'error',
};

const OrderCard = React.memo(function OrderCard({ id, customer, items, value, status, time }: OrderCardProps) {
    const label = statusLabels[status] || 'Indefinido';
    const color = statusColors[status] || 'default';

    return (
        <Card hoverEffect sx={{ mb: 2 }} noPadding>
            <Box p={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 1 }}>
                        {customer} {/* Ex: Mesa 10 */}
                    </Typography>
                    <Chip
                        label={label}
                        size="small"
                        color={color}
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    ID: #{id.substring(0, 6).toUpperCase()}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {time}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
});

export default OrderCard;