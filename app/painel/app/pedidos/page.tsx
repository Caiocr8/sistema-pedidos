'use client';


import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function PedidosPage() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Pedidos
            </Typography>
            <Typography>
                Aqui você pode gerenciar todos os pedidos feitos pelos clientes. Utilize as ferramentas disponíveis para visualizar, atualizar e processar os pedidos de forma eficiente.
            </Typography>
        </Box>
    );
}