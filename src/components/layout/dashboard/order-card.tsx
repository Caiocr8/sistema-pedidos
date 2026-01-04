'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// --- ALTERAÇÃO: Tipos de status reais do Firebase ---
export type OrderStatus = 'pendente' | 'em_preparo' | 'a_caminho' | 'entregue' | 'cancelado';

export interface OrderCardProps {
    id: string; // ID do Pedido
    customer: string; // Nome do Cliente
    items: string; // Descrição (ex: "2x Pizza, 1x Suco")
    value: number; // Valor total
    status: OrderStatus; // Status do Firebase
    time: string; // Tempo (ex: "5m atrás")
}

// --- ALTERAÇÃO: Mapeamento dos status do Firebase ---
// Agora inclui os status que você pediu
const statusLabels: Record<OrderStatus, string> = {
    pendente: 'Pendente',
    em_preparo: 'Preparando',
    a_caminho: 'A Caminho',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
};

const statusColors: Record<OrderStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    pendente: 'default' as const,
    em_preparo: 'warning' as const,
    a_caminho: 'info' as const,
    entregue: 'success' as const,
    cancelado: 'error' as const,
};

export default function OrderCard({ id, customer, items, value, status, time }: OrderCardProps) {
    // Garante que mesmo um status inesperado não quebre o componente
    const label = statusLabels[status] || 'Indefinido';
    const color = statusColors[status] || 'default';

    return (
        <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 1 }}>
                        {/* --- ALTERAÇÃO: Formata o ID para ser mais legível --- */}
                        Pedido #{id.substring(0, 8).toUpperCase()}
                    </Typography>
                    <Chip
                        label={label} // --- ALTERAÇÃO ---
                        size="small"
                        color={color} // --- ALTERAÇÃO ---
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {customer}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {items}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {/* --- ALTERAÇÃO: Formata o valor como moeda --- */}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {time} {/* --- ALTERAÇÃO: Removido "há " (já está no 'timeAgo') --- */}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}
