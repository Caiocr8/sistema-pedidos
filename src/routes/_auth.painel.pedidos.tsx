import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, Paper, Chip, IconButton, Tooltip, Select, MenuItem,
    FormControl, CircularProgress, Alert, Stack, Avatar,
    Divider, useTheme
} from '@mui/material';
import {
    Eye, Clock, User, DollarSign, CheckCircle,
    RefreshCw, XCircle, Truck, Plus, CalendarClock, Phone, CreditCard, Receipt
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// Importação dos seus componentes customizados
import StyledModal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import NovoPedidoModal from '@/components/pedidos/modal/novo-pedido';

const statusMap: any = {
    pendente: { label: 'Pendente', color: 'warning', icon: <Clock size={16} /> },
    em_preparo: { label: 'Em Preparo', color: 'info', icon: <RefreshCw size={16} /> },
    a_caminho: { label: 'A Caminho', color: 'primary', icon: <Truck size={16} /> },
    entregue: { label: 'Entregue', color: 'success', icon: <CheckCircle size={16} /> },
    cancelado: { label: 'Cancelado', color: 'error', icon: <XCircle size={16} /> },
};

// --- HELPER: Formata a data/hora do Firestore ---
const formatFirestoreDate = (timestamp: any) => {
    if (!timestamp) return '--/-- --:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
};

export const Route = createFileRoute('/_auth/painel/pedidos')({
    component: PedidosPage,
})

// --- SUB-COMPONENTE: Pedido Card (Layout via CSS Grid no Box para evitar erros) ---
const PedidoCard = React.memo(({ pedido, onUpdateStatus, onOpenDetails }: any) => {
    const theme = useTheme();
    const statusInfo = statusMap[pedido.status] || statusMap.pendente;
    const timeString = formatFirestoreDate(pedido.createdAt);

    // Correção TS: casting seguro para acessar cores dinâmicas
    const statusColor = (theme.palette as any)[statusInfo.color]?.main || theme.palette.grey[500];

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                borderLeft: `6px solid ${statusColor}`,
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 }
            }}
        >
            {/* Layout Responsivo com CSS Grid Nativo */}
            <Box sx={{
                display: 'grid',
                alignItems: 'center',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr', // Mobile: 1 coluna
                    sm: '1.5fr 1fr 1fr auto' // Desktop: Cliente | Total | Status | Ações
                }
            }}>

                {/* 1. Cliente */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main }}>
                        <User size={20} />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                            {pedido.clienteNome}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <Typography variant="caption" color="text.secondary">
                                ID: {pedido.docId.substring(0, 6)}...
                            </Typography>
                            <Chip
                                label={timeString}
                                size="small"
                                icon={<CalendarClock size={12} />}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem', border: '1px solid ' + theme.palette.divider }}
                            />
                        </Stack>
                    </Box>
                </Stack>

                {/* 2. Total */}
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                    <Typography variant="h6" fontWeight={800} color="success.main" display="flex" alignItems="center" gap={0.5}>
                        <DollarSign size={18} /> {pedido.total.toFixed(2)}
                    </Typography>
                </Box>

                {/* 3. Status */}
                <FormControl fullWidth size="small" variant="standard">
                    <Select
                        value={pedido.status}
                        onChange={(e) => onUpdateStatus(pedido.docId, e.target.value)}
                        disableUnderline
                        sx={{
                            fontWeight: 600,
                            color: statusColor,
                            fontSize: '0.875rem',
                            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 }
                        }}
                    >
                        {Object.keys(statusMap).map(k => (
                            <MenuItem key={k} value={k}>
                                <Stack direction="row" gap={1} alignItems="center">
                                    {statusMap[k].icon} {statusMap[k].label}
                                </Stack>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 4. Ações */}
                <Box sx={{ justifySelf: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Tooltip title="Ver Detalhes">
                        <IconButton onClick={() => onOpenDetails(pedido)} sx={{ bgcolor: theme.palette.action.hover }}>
                            <Eye size={20} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Paper>
    );
});

function PedidosPage() {
    const theme = useTheme();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [novoPedidoOpen, setNovoPedidoOpen] = useState(false);
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

    const handleOpenDetails = (pedido: any) => {
        setPedidoSelecionado(pedido);
        setDetailsOpen(true);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={4} gap={2}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'Caveat, cursive' }}>
                        Gerenciar Pedidos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Acompanhe o fluxo de vendas em tempo real.
                    </Typography>
                </Box>
                <Button variant="contained" color="primary" startIcon={<Plus size={20} />} onClick={() => setNovoPedidoOpen(true)}>
                    Novo Pedido
                </Button>
            </Stack>

            {loading && <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>}
            {!loading && error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && pedidos.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Nenhum pedido encontrado.</Alert>}

            {!loading && !error && (
                <Box>
                    {pedidos.map((pedido) => (
                        <PedidoCard
                            key={pedido.docId}
                            pedido={pedido}
                            onUpdateStatus={handleStatusChange}
                            onOpenDetails={handleOpenDetails}
                        />
                    ))}
                </Box>
            )}

            {/* --- MODAL DE DETALHES (Redesenhado para UX/UI melhor) --- */}
            <StyledModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                title="Comanda Digital"
            >
                {pedidoSelecionado && (
                    <Box sx={{ mt: 1 }}>
                        {/* Cabeçalho do Modal */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.action.hover
                        }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">ID do Pedido</Typography>
                                <Typography variant="body2" fontWeight="bold">#{pedidoSelecionado.docId.slice(0, 8).toUpperCase()}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" display="block">Data & Hora</Typography>
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                    <CalendarClock size={14} opacity={0.7} />
                                    <Typography variant="body2" fontWeight="bold">
                                        {formatFirestoreDate(pedidoSelecionado.createdAt)}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Box>

                        {/* Informações do Cliente (Grid Clean) */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2,
                            mb: 3
                        }}>
                            <Box>
                                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                                    <User size={16} color={theme.palette.primary.main} />
                                    <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight={600}>{pedidoSelecionado.clienteNome}</Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                                    <Phone size={16} color={theme.palette.primary.main} />
                                    <Typography variant="subtitle2" color="text.secondary">Contato</Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight={600}>{pedidoSelecionado.clienteTelefone}</Typography>
                            </Box>

                            <Box>
                                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                                    <CreditCard size={16} color={theme.palette.primary.main} />
                                    <Typography variant="subtitle2" color="text.secondary">Pagamento</Typography>
                                </Stack>
                                <Chip label={pedidoSelecionado.metodoPagamento} size="small" color="default" variant="filled" />
                            </Box>
                        </Box>

                        {/* Lista de Itens (Estilo Nota Fiscal) */}
                        <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
                            <Box sx={{
                                p: 1.5,
                                bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900',
                                borderBottom: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Receipt size={16} />
                                <Typography variant="subtitle2" fontWeight={700}>Itens Consumidos</Typography>
                            </Box>

                            <Stack divider={<Divider flexItem />} spacing={0}>
                                {pedidoSelecionado.itens?.map((item: any, i: number) => (
                                    <Box key={i} sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        '&:hover': { bgcolor: theme.palette.action.hover }
                                    }}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                                                {item.quantidade}x
                                            </Avatar>
                                            <Typography variant="body2">{item.nome}</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>

                            {/* Totalizador */}
                            <Box sx={{ p: 2, bgcolor: theme.palette.primary.main + '10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={600}>Total a Pagar</Typography>
                                <Typography variant="h5" fontWeight={800} color="primary.main">
                                    R$ {pedidoSelecionado.total.toFixed(2)}
                                </Typography>
                            </Box>
                        </Paper>

                        <Button onClick={() => setDetailsOpen(false)} fullWidth variant="outlined" size="large">
                            Fechar
                        </Button>
                    </Box>
                )}
            </StyledModal>

            <StyledModal open={novoPedidoOpen} onClose={() => setNovoPedidoOpen(false)} title="">
                <NovoPedidoModal />
            </StyledModal>
        </Box>
    );
}