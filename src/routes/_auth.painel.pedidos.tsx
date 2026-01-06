import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Box, Paper, Chip, IconButton,
    FormControl, CircularProgress, Alert, Stack, Avatar,
    Divider, useTheme, Select, MenuItem, InputLabel, TextField,
    Tooltip
} from '@mui/material';
import {
    Clock, DollarSign, CheckCircle, RefreshCw, XCircle, Truck, Plus,
    Timer as TimerIcon, Receipt, Trash2, CreditCard, ChevronRight, X, Ban
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useCardapioStore } from '@/store/cardapioStore';
// Importação dos serviços atualizados
import { finalizarPedido, cancelarPedido, cancelarItemIndividual } from '@/lib/services/pedidos';

import StyledModal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import NovoPedidoModal from '@/components/pedidos/modal/novo-pedido';
import CancelarModal from '@/components/pedidos/modal/cancelar-pedido'; // Componente genérico atualizado

const statusMap: any = {
    pendente: { label: 'Aberta', color: 'warning', icon: <Clock size={16} /> },
    em_preparo: { label: 'Na Cozinha', color: 'info', icon: <RefreshCw size={16} /> },
    a_caminho: { label: 'Pronto', color: 'primary', icon: <CheckCircle size={16} /> },
    entregue: { label: 'Fechada', color: 'success', icon: <DollarSign size={16} /> },
    cancelado: { label: 'Cancelado', color: 'error', icon: <XCircle size={16} /> },
};

// ... (OrderTimer component permanece o mesmo) ...
const OrderTimer = ({ createdAt, status, large = false }: { createdAt: any, status: string, large?: boolean }) => {
    const theme = useTheme();
    const [timeElapsed, setTimeElapsed] = useState('00:00');
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

            setTimeElapsed(formatted);

            if (totalSeconds > 2700) setIsLate(true);
        };

        updateTimer(); // Executa imediatamente para não esperar 1 seg
        const interval = setInterval(updateTimer, 1000); // Atualiza a cada segundo

        return () => clearInterval(interval);
    }, [createdAt, status]);

    if (status === 'entregue' || status === 'cancelado') return <Chip label="Finalizado" size="small" color="success" variant="outlined" />;

    return (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{
            color: isLate ? 'error.main' : 'text.primary',
            bgcolor: large ? (isLate ? 'error.light' : 'action.hover') : 'transparent',
            px: large ? 1.5 : 0, py: large ? 0.5 : 0, borderRadius: 1
        }}>
            <TimerIcon size={large ? 18 : 14} />
            <Typography variant={large ? "h6" : "body2"} fontWeight={700} fontFamily="monospace">
                {timeElapsed}
            </Typography>
        </Stack>
    );
};

export const Route = createFileRoute('/_auth/painel/pedidos')({ component: PedidosPage })

// --- MODAL DE COMANDA ---
const ComandaContent = ({ pedido, onClose }: { pedido: any, onClose: () => void }) => {
    const theme = useTheme();
    const { itens: cardapio } = useCardapioStore();

    // Estados UI
    const [isAdding, setIsAdding] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    // Estado para Cancelamento (Genérico: pode ser 'mesa' ou 'item')
    const [cancelType, setCancelType] = useState<'mesa' | 'item' | null>(null);
    const [itemToCancelIndex, setItemToCancelIndex] = useState<number | null>(null);
    const [itemToCancelName, setItemToCancelName] = useState('');

    // Estados Formulário Add
    const [selectedItemId, setSelectedItemId] = useState('');
    const [qtdToAdd, setQtdToAdd] = useState(1);

    // --- Lógica: Adicionar Item ---
    const handleAddItem = async () => {
        if (!selectedItemId || qtdToAdd < 1) return;
        setLoadingAction(true);
        try {
            const produto = cardapio.find(p => p.id === Number(selectedItemId));
            if (!produto) return;

            const novoItem = {
                itemId: produto.id,
                nome: produto.nome,
                precoUnitario: produto.preco,
                quantidade: qtdToAdd
            };
            const novoTotal = pedido.total + (produto.preco * qtdToAdd);

            await updateDoc(doc(db as Firestore, 'pedidos', pedido.docId), {
                itens: [...pedido.itens, novoItem],
                total: novoTotal
            });
            setIsAdding(false); setQtdToAdd(1); setSelectedItemId('');
        } catch (error) { console.error(error); alert("Erro ao adicionar."); } finally { setLoadingAction(false); }
    };

    // --- Lógica: Preparar Cancelamento de Item ---
    const clickCancelItem = (index: number, item: any) => {
        setItemToCancelIndex(index);
        setItemToCancelName(item.nome);
        setCancelType('item'); // Abre o modal em modo Item
    };

    // --- Lógica: Preparar Cancelamento da Mesa ---
    const clickCancelMesa = () => {
        setCancelType('mesa'); // Abre o modal em modo Mesa
    };

    // --- Lógica: Executar Cancelamento (Callback do Modal) ---
    const handleConfirmCancel = async (motivo: string) => {
        setLoadingAction(true);
        try {
            if (cancelType === 'item' && itemToCancelIndex !== null) {
                // Cancela ITEM INDIVIDUAL
                await cancelarItemIndividual(pedido.docId, pedido, itemToCancelIndex, motivo);
            } else if (cancelType === 'mesa') {
                // Cancela MESA INTEIRA
                await cancelarPedido(pedido, motivo);
                onClose(); // Fecha modal principal
            }
            setCancelType(null); // Fecha modal de motivo
        } catch (error) {
            console.error(error);
            alert("Erro ao cancelar. Tente novamente.");
        } finally {
            setLoadingAction(false);
        }
    };

    // --- Lógica: Finalizar/Pagar ---
    const handlePay = async () => {
        if (!confirm(`Confirmar recebimento de R$ ${pedido.total.toFixed(2)}?`)) return;
        setLoadingAction(true);
        try {
            await finalizarPedido(pedido);
            onClose();
        } catch (error) { console.error(error); setLoadingAction(false); }
    };

    // Se estiver em modo de cancelamento, mostra o Modal de Motivo sobreposto
    if (cancelType) {
        return (
            <CancelarModal
                titulo={cancelType === 'mesa' ? "Cancelar Mesa Inteira" : `Cancelar ${itemToCancelName}`}
                descricao={cancelType === 'mesa'
                    ? "A mesa será encerrada e movida para cancelados."
                    : "O item será removido da conta e o valor deduzido."}
                loading={loadingAction}
                onConfirm={handleConfirmCancel}
                onCancel={() => setCancelType(null)}
            />
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: { sm: 600 } }}>
            {/* Header Fixo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, boxShadow: 2 }}>
                <Stack direction="row" gap={2} alignItems="center">
                    <Box sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.8rem', boxShadow: 1 }}>
                        {pedido.mesa}
                    </Box>
                    <Box>
                        <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700, lineHeight: 1 }}>MESA ABERTA</Typography>
                        <Box sx={{ filter: 'brightness(1.2)' }}><OrderTimer createdAt={pedido.createdAt} status={pedido.status} /></Box>
                    </Box>
                </Stack>
                <Box textAlign="right">
                    <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700 }}>TOTAL A PAGAR</Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>R$ {pedido.total.toFixed(2)}</Typography>
                </Box>
            </Box>

            {/* Lista Scrollável */}
            <Paper variant="outlined" sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                <Stack divider={<Divider />} spacing={0}>
                    {pedido.itens.map((item: any, i: number) => (
                        <Box key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
                            <Box display="flex" gap={2} alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, fontSize: '0.9rem', bgcolor: 'grey.200', color: 'text.primary', fontWeight: 'bold' }}>{item.quantidade}</Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight={600}>{item.nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">Unit: R$ {item.precoUnitario.toFixed(2)}</Typography>
                                </Box>
                            </Box>
                            <Stack direction="row" gap={2} alignItems="center">
                                <Typography fontWeight={700} fontSize="1.1rem">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</Typography>
                                <Tooltip title="Cancelar este item">
                                    <IconButton size="small" onClick={() => clickCancelItem(i, item)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' } }}>
                                        <Trash2 size={18} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>
                    ))}
                    {pedido.itens.length === 0 && <Box p={6} textAlign="center" color="text.secondary"><Typography>Nenhum item lançado ainda.</Typography></Box>}
                </Stack>
            </Paper>

            {/* Formulário de Adição */}
            {!isAdding ? (
                <Button variant="outlined" onClick={() => setIsAdding(true)} fullWidth startIcon={<Plus />} sx={{ mb: 3, borderStyle: 'dashed', height: 50, color: 'text.secondary', borderColor: 'divider' }}>
                    ADICIONAR PRODUTO
                </Button>
            ) : (
                <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.main' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Selecione o Produto</InputLabel>
                        <Select value={selectedItemId} label="Selecione o Produto" onChange={(e) => setSelectedItemId(e.target.value)} autoFocus>
                            {cardapio.filter(i => i.disponivel).map(p => (
                                <MenuItem key={p.id} value={p.id}>{p.nome} - R$ {p.preco.toFixed(2)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField type="number" size="small" value={qtdToAdd} onChange={(e) => setQtdToAdd(Number(e.target.value))} inputProps={{ min: 1 }} sx={{ width: 80 }} />
                    <Button variant="contained" color="success" onClick={handleAddItem} disabled={loadingAction} sx={{ minWidth: 40, px: 0 }}><Plus /></Button>
                    <IconButton onClick={() => setIsAdding(false)}><X /></IconButton>
                </Paper>
            )}

            {/* Rodapé de Ações */}
            <Stack direction="row" gap={2} mt="auto">
                <Button
                    variant="outlined"
                    color="error"
                    onClick={clickCancelMesa}
                    startIcon={<Ban size={20} />}
                    sx={{ flex: 1, height: 56 }}
                >
                    Cancelar Mesa
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handlePay}
                    disabled={pedido.total === 0 || loadingAction}
                    startIcon={<CreditCard size={20} />}
                    sx={{ flex: 2, height: 56, fontSize: '1.1rem', fontWeight: 700 }}
                >
                    Receber Pagamento
                </Button>
            </Stack>
        </Box>
    );
};

// ... (O resto do arquivo PedidosPage e PedidoCard mantém-se igual à resposta anterior, pois já está otimizado) ...
// Apenas certifique-se de manter o `PedidoCard` e o `PedidosPage` no mesmo arquivo.
const PedidoCard = React.memo(({ pedido, onOpenDetails }: any) => {
    // ... (Código do Card da Lista da resposta anterior)
    const theme = useTheme();
    const statusColor = (theme.palette as any)[statusMap[pedido.status]?.color]?.main || theme.palette.grey[500];
    return (
        <Paper elevation={2} onClick={() => onOpenDetails(pedido)} sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: `6px solid ${statusColor}`, bgcolor: 'background.paper', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6, bgcolor: theme.palette.action.hover } }}>
            <Box sx={{ display: 'grid', alignItems: 'center', gap: 4, gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr auto' } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar variant="rounded" sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText, fontWeight: 'bold', width: 56, height: 56, fontSize: '1.5rem' }}>{pedido.mesa}</Avatar>
                    <Box><Typography variant="overline" color="text.secondary" fontWeight={700}>MESA</Typography><Typography variant="h5" fontWeight={800} lineHeight={1}>{pedido.mesa.padStart(2, '0')}</Typography></Box>
                </Stack>
                <Box><Typography variant="overline" color="text.secondary" display="block">TEMPO</Typography><OrderTimer createdAt={pedido.createdAt} status={pedido.status} /></Box>
                <Box><Typography variant="overline" color="text.secondary" display="block">TOTAL</Typography><Typography variant="h6" fontWeight={700} color="success.main">R$ {pedido.total.toFixed(2)}</Typography></Box>
                <Box sx={{ justifySelf: 'end' }}><ChevronRight size={24} color={theme.palette.text.disabled} /></Box>
            </Box>
        </Paper>
    );
});

function PedidosPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [novoPedidoOpen, setNovoPedidoOpen] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);

    useEffect(() => {
        const q = query(collection(db as Firestore, 'pedidos'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
            setPedidos(data); setLoading(false);
        });
    }, []);

    // Sincroniza o modal aberto com os dados em tempo real do Firestore
    const pedidoRealTime = useMemo(() => pedidos.find(p => p.docId === pedidoSelecionado?.docId), [pedidos, pedidoSelecionado]);

    // Se o pedido sumir (foi finalizado/cancelado), fecha o modal
    useEffect(() => { if (pedidoSelecionado && !pedidoRealTime) setDetailsOpen(false); }, [pedidoRealTime, pedidoSelecionado]);

    return (
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: 2, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box><Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive' }}>Mesas & Pedidos</Typography><Typography variant="subtitle1" color="text.secondary">Gerenciamento de salão</Typography></Box>
                <Button variant="contained" size="large" startIcon={<Plus size={24} />} onClick={() => setNovoPedidoOpen(true)} sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1.1rem' }}>Nova Mesa</Button>
            </Stack>
            {loading && <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}
            {!loading && (
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado').map((pedido) => (
                        <PedidoCard key={pedido.docId} pedido={pedido} onOpenDetails={(p: any) => { setPedidoSelecionado(p); setDetailsOpen(true); }} />
                    ))}
                </Box>
            )}
            <StyledModal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="">
                {pedidoRealTime && <ComandaContent pedido={pedidoRealTime} onClose={() => setDetailsOpen(false)} />}
            </StyledModal>
            <StyledModal open={novoPedidoOpen} onClose={() => setNovoPedidoOpen(false)} title=""><NovoPedidoModal onClose={() => setNovoPedidoOpen(false)} /></StyledModal>
        </Box>
    );
}