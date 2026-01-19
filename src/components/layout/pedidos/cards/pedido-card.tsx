import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { ChevronRight, Clock, RefreshCw, CheckCircle, DollarSign, XCircle } from 'lucide-react';
import Card from '@/components/ui/card';
import OrderTimer from './order-timer';

const statusMap: any = {
    pendente: { label: 'Aberta', color: 'warning', icon: <Clock size={16} /> },
    em_preparo: { label: 'Na Cozinha', color: 'info', icon: <RefreshCw size={16} /> },
    a_caminho: { label: 'Pronto', color: 'primary', icon: <CheckCircle size={16} /> },
    entregue: { label: 'Fechada', color: 'success', icon: <DollarSign size={16} /> },
    cancelado: { label: 'Cancelado', color: 'error', icon: <XCircle size={16} /> },
};

interface PedidoCardProps {
    pedido: any;
    onOpenDetails: () => void;
}

const PedidoCard = React.memo(({ pedido, onOpenDetails }: PedidoCardProps) => {
    const theme = useTheme();
    const statusColor = (theme.palette as any)[statusMap[pedido.status]?.color]?.main || theme.palette.grey[500];

    return (
        <Card
            hoverEffect
            onClick={onOpenDetails}
            sx={{
                p: 0,
                mb: 2,
                borderLeft: `8px solid ${statusColor}`,
                transition: 'transform 0.2s',
            }}
            noPadding
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" gap={3} alignItems="center">
                    <Box sx={{
                        width: 64, height: 64,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 1,
                        borderColor: 'divider'
                    }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="0.65rem">MESA</Typography>
                        <Typography variant="h4" fontWeight={800} lineHeight={1}>{pedido.mesa}</Typography>
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TEMPO</Typography>
                        <Box mt={0.5}>
                            <OrderTimer createdAt={pedido.createdAt} status={pedido.status} />
                        </Box>
                    </Box>
                </Stack>

                <Stack direction="row" alignItems="center" gap={4}>
                    <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL</Typography>
                        <Typography variant="h6" fontWeight={800} color="success.main">
                            R$ {pedido.total.toFixed(2)}
                        </Typography>
                    </Box>
                    <ChevronRight color={theme.palette.text.disabled} size={28} />
                </Stack>
            </Box>
        </Card>
    );
});

export default PedidoCard;