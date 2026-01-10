import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Box, Paper, Chip, IconButton, Tooltip,
    FormControl, CircularProgress, Alert, Stack, Avatar,
    Divider, useTheme, Select, MenuItem, InputLabel, TextField
} from '@mui/material';
import {
    Clock, DollarSign, CheckCircle, RefreshCw, XCircle, Plus,
    Timer as TimerIcon, Receipt, Trash2, CreditCard, ChevronRight, X, Ban
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useCardapioStore } from '@/store/cardapioStore';
import { finalizarPedido, cancelarPedido, cancelarItemIndividual } from '@/lib/services/pedidos';

import StyledModal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import NovoPedidoModal from '@/components/layout/pedidos/modal/novo-pedido';
import CancelarModal from '@/components/layout/pedidos/modal/cancelar-pedido';

export const Route = createFileRoute('/_auth/painel/pedidos')({
    component: PedidosPage,
})

const statusMap: any = {
    pendente: { label: 'Aberta', color: 'warning', icon: <Clock size={16} /> },
    em_preparo: { label: 'Na Cozinha', color: 'info', icon: <RefreshCw size={16} /> },
    a_caminho: { label: 'Pronto', color: 'primary', icon: <CheckCircle size={16} /> },
    entregue: { label: 'Fechada', color: 'success', icon: <DollarSign size={16} /> },
    cancelado: { label: 'Cancelado', color: 'error', icon: <XCircle size={16} /> },
};

const OrderTimer = ({ createdAt, status, large = false }: { createdAt: any, status: string, large?: boolean }) => {
    const theme = useTheme();
    const [timeLabel, setTimeLabel] = useState('0 min');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        if (!createdAt || status === 'entregue' || status === 'cancelado') return;
        const startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        const updateTimer = () => {
            const now = new Date();
            const totalSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            let formatted = '';
            if (hours > 0) {
                formatted = `${hours} h ${String(minutes).padStart(2, '0')} min`;
            } else {
                formatted = `${minutes} min`;
            }
            setTimeLabel(formatted);
            if (totalSeconds > 2700) setIsLate(true);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    if (status === 'entregue' || status === 'cancelado') return <Chip label="Finalizado" size="small" color="success" variant="outlined" />;

    return (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: isLate ? 'error.main' : 'text.primary', bgcolor: large ? (isLate ? 'error.light' : 'action.hover') : 'transparent', px: large ? 1.5 : 0, py: large ? 0.5 : 0, borderRadius: 1 }}>
            <TimerIcon size={large ? 18 : 14} />
            <Typography variant={large ? "h6" : "body2"} fontWeight={700} fontFamily="monospace" sx={{ whiteSpace: 'nowrap' }}>{timeLabel}</Typography>
        </Stack>
    );
};

const ComandaContent = ({ pedido, onClose }: { pedido: any, onClose: () => void }) => {
    const { itens: cardapio } = useCardapioStore();
    const [isAdding, setIsAdding] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [cancelType, setCancelType] = useState<'mesa' | 'item' | null>(null);
    const [itemToCancel, setItemToCancel] = useState<{ index: number, name: string } | null>(null);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [qtdToAdd, setQtdToAdd] = useState(1);

    const handleAddItem = async () => {
        if (!selectedItemId || qtdToAdd < 1) return;
        setLoadingAction(true);
        try {
            const produto = cardapio.find(p => p.id === Number(selectedItemId));
            if (!produto) return;
            const novoItem = { itemId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade: qtdToAdd };
            const novoTotal = pedido.total + (produto.preco * qtdToAdd);
            await updateDoc(doc(db as Firestore, 'pedidos', pedido.docId), { itens: [...pedido.itens, novoItem], total: novoTotal });
            setIsAdding(false); setQtdToAdd(1); setSelectedItemId('');
        } catch (error) { console.error(error); alert("Erro ao adicionar."); } finally { setLoadingAction(false); }
    };

    const handleConfirmCancel = async (motivo: string) => {
        setLoadingAction(true);
        try {
            if (cancelType === 'item' && itemToCancel) {
                await cancelarItemIndividual(pedido.docId, pedido, itemToCancel.index, motivo);
            } else if (cancelType === 'mesa') {
                await cancelarPedido(pedido, motivo);
                onClose();
            }
            setCancelType(null); setItemToCancel(null);
        } catch (error) { console.error(error); } finally { setLoadingAction(false); }
    };

    const handlePay = async () => {
        if (!confirm(`Confirmar R$ ${pedido.total.toFixed(2)}?`)) return;
        setLoadingAction(true);
        try { await finalizarPedido(pedido); onClose(); } catch (error) { setLoadingAction(false); }
    };

    if (cancelType) {
        return <CancelarModal titulo={cancelType === 'mesa' ? "Cancelar Mesa" : "Cancelar Item"} descricao={cancelType === 'mesa' ? `Cancelar a Mesa ${pedido.mesa}?` : `Remover "${itemToCancel?.name}"?`} loading={loadingAction} onConfirm={handleConfirmCancel} onCancel={() => { setCancelType(null); setItemToCancel(null); }} />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: { md: '600px' } }}>
            <Paper elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2 }}>
                <Stack direction="row" gap={2} alignItems="center">
                    <Box sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.8rem' }}>{pedido.mesa}</Box>
                    <Box><Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700 }}>MESA ABERTA</Typography><Box sx={{ filter: 'brightness(1.2)' }}><OrderTimer createdAt={pedido.createdAt} status={pedido.status} large /></Box></Box>
                </Stack>
                <Box textAlign="right"><Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700 }}>TOTAL</Typography><Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>R$ {pedido.total.toFixed(2)}</Typography></Box>
            </Paper>

            <Paper variant="outlined" sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, borderRadius: 2 }}>
                <Stack divider={<Divider />} spacing={0}>
                    {pedido.itens.map((item: any, i: number) => (
                        <Box key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { bgcolor: 'action.hover' } }}>
                            <Box display="flex" gap={2} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'action.selected', color: 'text.primary', fontWeight: 'bold' }}>{item.quantidade}</Avatar>
                                <Box><Typography variant="body1" fontWeight={600}>{item.nome}</Typography><Typography variant="caption" color="text.secondary">Unit: R$ {item.precoUnitario.toFixed(2)}</Typography></Box>
                            </Box>
                            <Stack direction="row" gap={2} alignItems="center">
                                <Typography fontWeight={700}>R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</Typography>
                                <Tooltip title="Cancelar Item"><IconButton size="small" onClick={() => { setItemToCancel({ index: i, name: item.nome }); setCancelType('item'); }}><Trash2 size={18} /></IconButton></Tooltip>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            </Paper>

            <Box sx={{ mb: 3 }}>
                {!isAdding ? (
                    <Button variant="outlined" onClick={() => setIsAdding(true)} fullWidth startIcon={<Plus />} sx={{ borderStyle: 'dashed', height: 48, color: 'text.secondary' }}>ADICIONAR PRODUTO</Button>
                ) : (
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl fullWidth size="small"><InputLabel>Produto</InputLabel><Select value={selectedItemId} label="Produto" onChange={(e) => setSelectedItemId(e.target.value)} autoFocus>{cardapio.filter(i => i.disponivel).map(p => <MenuItem key={p.id} value={p.id}>{p.nome} - R$ {p.preco.toFixed(2)}</MenuItem>)}</Select></FormControl>
                        <TextField type="number" size="small" value={qtdToAdd} onChange={(e) => setQtdToAdd(Number(e.target.value))} inputProps={{ min: 1 }} sx={{ width: 80 }} />
                        <IconButton color="success" onClick={handleAddItem}><Plus /></IconButton><IconButton onClick={() => setIsAdding(false)}><X /></IconButton>
                    </Paper>
                )}
            </Box>

            <Stack direction="row" gap={2} mt="auto">
                <Button variant="text" color="error" onClick={() => setCancelType('mesa')} startIcon={<Ban size={20} />} sx={{ flex: 1, height: 56 }}>Cancelar Mesa</Button>
                <Button variant="contained" color="success" onClick={handlePay} disabled={pedido.total === 0 || loadingAction} startIcon={<CreditCard size={20} />} sx={{ flex: 2, height: 56, fontSize: '1.1rem' }}>Receber Pagamento</Button>
            </Stack>
        </Box>
    );
};

const PedidoCard = React.memo(({ pedido, onOpenDetails }: any) => {
    const theme = useTheme();
    const statusColor = (theme.palette as any)[statusMap[pedido.status]?.color]?.main || theme.palette.grey[500];
    return (
        <Paper onClick={onOpenDetails} elevation={1} sx={{ p: 0, mb: 2, borderRadius: 3, overflow: 'hidden', cursor: 'pointer', display: 'flex', borderLeft: `8px solid ${statusColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
            <Box sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" gap={3} alignItems="center">
                    <Box sx={{ width: 64, height: 64, bgcolor: 'background.default', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="0.65rem">MESA</Typography><Typography variant="h4" fontWeight={800} lineHeight={1}>{pedido.mesa}</Typography>
                    </Box>
                    <Box><Typography variant="caption" color="text.secondary" fontWeight={600}>TEMPO</Typography><Box mt={0.5}><OrderTimer createdAt={pedido.createdAt} status={pedido.status} /></Box></Box>
                </Stack>
                <Stack direction="row" alignItems="center" gap={4}>
                    <Box textAlign="right"><Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL</Typography><Typography variant="h6" fontWeight={800} color="success.main">R$ {pedido.total.toFixed(2)}</Typography></Box>
                    <ChevronRight color={theme.palette.text.disabled} size={28} />
                </Stack>
            </Box>
        </Paper>
    );
});

function PedidosPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [novoOpen, setNovoOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db as Firestore, 'pedidos'), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
            setPedidos(data); setLoading(false);
        });
    }, []);

    const pedidoAtivo = useMemo(() => pedidos.find(p => p.docId === detailId), [pedidos, detailId]);
    useEffect(() => { if (detailId && !pedidoAtivo) setDetailId(null); }, [pedidoAtivo, detailId]);

    const mesasAtivas = pedidos.filter(p => p.status !== 'entregue').length;

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', width: '100%', mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box>
                    <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 1 }}>Controle de Mesas</Typography>
                    <Typography variant="body1" color="text.secondary">{mesasAtivas} {mesasAtivas === 1 ? 'mesa ativa' : 'mesas ativas'}</Typography>
                </Box>
                <Button variant="contained" size="large" startIcon={<Plus size={24} />} onClick={() => setNovoOpen(true)} sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1.1rem' }}>Nova Mesa</Button>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
                {loading && <Box display="flex" justifyContent="center" mt={10}><CircularProgress size={60} /></Box>}
                {!loading && pedidos.length === 0 && <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '2px dashed', borderColor: 'divider' }} elevation={0}><Typography variant="h5" color="text.secondary" fontWeight={600}>Salão Livre</Typography></Paper>}
                <Stack spacing={2}>{pedidos.map(p => (p.status !== 'entregue' && p.status !== 'cancelado') && (<PedidoCard key={p.docId} pedido={p} onOpenDetails={() => setDetailId(p.docId)} />))}</Stack>
            </Box>
            <StyledModal open={!!detailId} onClose={() => setDetailId(null)} title="">{pedidoAtivo && <ComandaContent pedido={pedidoAtivo} onClose={() => setDetailId(null)} />}</StyledModal>
            <StyledModal open={novoOpen} onClose={() => setNovoOpen(false)} title=""><NovoPedidoModal onClose={() => setNovoOpen(false)} /></StyledModal>
        </Box>
    );
}