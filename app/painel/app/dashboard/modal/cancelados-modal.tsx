'use client';

import React from 'react';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';

// Dados mocados para os pedidos cancelados
const mockCancelados = [
    {
        id: 'P-9875',
        cliente: 'Ana Clara',
        motivo: 'Cliente solicitou cancelamento (desistência).',
        valor: 45.50,
    },
    {
        id: 'P-9872',
        cliente: 'Marcos Borges',
        motivo: 'Item indisponível no estoque.',
        valor: 89.90,
    },
    {
        id: 'P-9871',
        cliente: 'Loja Teste',
        motivo: 'Endereço de entrega não encontrado.',
        valor: 112.00,
    },
    {
        id: 'P-9866',
        cliente: 'Júlia Martins',
        motivo: 'Falha no pagamento.',
        valor: 25.00,
    },
];

/**
 * Conteúdo de placeholder para o modal de Pedidos Cancelados.
 */
export default function CanceladosModalContent() {
    return (
        <Stack spacing={2} divider={<Divider />}>
            {mockCancelados.map((pedido) => (
                <Box key={pedido.id} sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Pedido {pedido.id}
                        </Typography>
                        <Typography variant="body1" color="error.main" sx={{ fontWeight: 600 }}>
                            - R$ {pedido.valor.toFixed(2)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Cliente: {pedido.cliente}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Motivo: {pedido.motivo}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
}
