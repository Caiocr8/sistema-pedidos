import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, List, ListItem, ListItemText, Divider, Chip, IconButton, Tooltip, Select, MenuItem, FormControl, CircularProgress, Alert, Stack } from '@mui/material';
import { Eye, Clock, User, DollarSign, CheckCircle, RefreshCw, XCircle, Truck } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import StyledModal from '@/components/ui/modal';
import Button from '@/components/ui/button';

const statusMap: any = {
    pendente: { label: 'Pendente', color: 'warning', icon: <Clock size={16} /> },
    em_preparo: { label: 'Em Preparo', color: 'info', icon: <RefreshCw size={16} /> },
    a_caminho: { label: 'A Caminho', color: 'primary', icon: <Truck size={16} /> },
    entregue: { label: 'Entregue', color: 'success', icon: <CheckCircle size={16} /> },
    cancelado: { label: 'Cancelado', color: 'error', icon: <XCircle size={16} /> },
};

export const Route = createFileRoute('/_auth/painel/pedidos')({
    component: PedidosPage,
})

function PedidosPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);

    useEffect(() => {
        if (!db) { setError('Erro de conexão DB'); return; }
        const q = query(collection(db as Firestore, 'pedidos'), orderBy('createdAt', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            setPedidos(data);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Falha ao carregar pedidos.');
            setLoading(false);
        });
    }, []);

    const handleStatusChange = async (docId: string, novoStatus: string) => {
        try {
            await updateDoc(doc(db as Firestore, 'pedidos', docId), { status: novoStatus });
        } catch (e) { console.error("Erro ao atualizar", e); }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" fontWeight={700} mb={3}>Histórico de Pedidos</Typography>

            {loading && <CircularProgress />}
            {!loading && error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <Paper elevation={2}>
                    <List disablePadding>
                        {pedidos.map((pedido, index) => {
                            const statusInfo = statusMap[pedido.status] || statusMap.pendente;
                            return (
                                <React.Fragment key={pedido.docId}>
                                    <ListItem sx={{ flexWrap: 'wrap', py: 2, gap: 2 }} secondaryAction={
                                        <Tooltip title="Ver Detalhes">
                                            <IconButton onClick={() => { setPedidoSelecionado(pedido); setModalOpen(true); }}><Eye /></IconButton>
                                        </Tooltip>
                                    }>
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                    <Chip icon={<User size={14} />} label={pedido.clienteNome} size="small" />
                                                    <Chip icon={<DollarSign size={14} />} label={`R$ ${pedido.total.toFixed(2)}`} size="small" color="success" />
                                                </Stack>
                                            }
                                            secondary={`ID: ${pedido.docId.substring(0, 8)}...`}
                                        />
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <Select value={pedido.status} onChange={(e) => handleStatusChange(pedido.docId, e.target.value)}>
                                                {Object.keys(statusMap).map(k => (
                                                    <MenuItem key={k} value={k}>
                                                        <Stack direction="row" gap={1} alignItems="center">
                                                            {statusMap[k].icon} {statusMap[k].label}
                                                        </Stack>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </ListItem>
                                    {index < pedidos.length - 1 && <Divider />}
                                </React.Fragment>
                            )
                        })}
                    </List>
                </Paper>
            )}

            <StyledModal open={modalOpen} onClose={() => setModalOpen(false)} title="Detalhes do Pedido">
                {pedidoSelecionado && (
                    <Stack spacing={2} mt={2}>
                        <Typography><strong>Cliente:</strong> {pedidoSelecionado.clienteNome}</Typography>
                        <Divider />
                        <List dense>
                            {pedidoSelecionado.itens?.map((item: any, i: number) => (
                                <ListItem key={i} disableGutters>
                                    <ListItemText primary={`${item.quantidade}x ${item.nome}`} />
                                    <Typography fontWeight="bold">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</Typography>
                                </ListItem>
                            ))}
                        </List>
                        <Divider />
                        <Typography variant="h6" align="right">Total: R$ {pedidoSelecionado.total.toFixed(2)}</Typography>
                        <Button onClick={() => setModalOpen(false)} fullWidth variant="outlined">Fechar</Button>
                    </Stack>
                )}
            </StyledModal>
        </Box>
    );
}