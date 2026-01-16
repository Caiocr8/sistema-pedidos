import { useEffect, useState } from 'react';
import {
    Box,
    DialogContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Button,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { ShoppingBag, CreditCard, Banknote, QrCode, Receipt, DollarSign } from 'lucide-react';

// Firebase
import { db } from '@/lib/api/firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// Stores e Services
import { useUserStore } from '@/store/user-store';
import { finalizarPedido } from '@/lib/services/pedidos';
import { imprimirRelatorio } from '@/lib/utils/print-service';

// Tipagem local
interface Order {
    id: string;
    mesa: string;
    total: number;
    status: string;
    itens: any[];
    createdAt: any;
}

export default function VendasModalContent() {
    const { user } = useUserStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado de Seleção
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [processing, setProcessing] = useState(false);

    // 1. Monitorar Mesas Ativas (Realtime)
    useEffect(() => {
        const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Função de Finalização
    const handleFinalizar = async () => {
        if (!selectedOrder || !user?.uid) return;
        setProcessing(true);

        try {
            // CORREÇÃO AQUI:
            // O serviço espera um objeto Record<string, number> (ex: { 'Pix': 50.00 })
            // Como este modal é simplificado, assumimos que o valor total é pago no método escolhido.

            const pagamentosMap = {
                [paymentMethod]: selectedOrder.total
            };

            const detalhesFinanceiros = {
                troco: 0,
                totalFinal: selectedOrder.total,
                parcelas: 1
            };

            await finalizarPedido(
                selectedOrder.id,
                pagamentosMap,      // Argumento 2: Objeto de pagamentos
                detalhesFinanceiros, // Argumento 3: Detalhes financeiros
                user.uid,
                user.displayName || 'Operador'
            );

            const textoCupom = gerarTextoCupom(selectedOrder, paymentMethod, user.displayName || 'Caixa');
            imprimirRelatorio(textoCupom);

            setSelectedOrder(null);
            alert("Venda finalizada com sucesso!");
        } catch (error: any) {
            console.error(error);
            alert("Erro ao finalizar: " + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const gerarTextoCupom = (order: Order, metodo: string, operador: string) => {
        const data = new Date().toLocaleString('pt-BR');
        let txt = "================================\n";
        txt += "         RECIBO DE VENDA        \n";
        txt += "================================\n";
        txt += `MESA: ${order.mesa}\n`;
        txt += `DATA: ${data}\n`;
        txt += "--------------------------------\n";
        order.itens.forEach(item => {
            txt += `${item.quantidade}x ${item.nome.padEnd(20)} R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}\n`;
        });
        txt += "--------------------------------\n";
        txt += `TOTAL: R$ ${order.total.toFixed(2)}\n`;
        txt += `PAGAMENTO: ${metodo.toUpperCase()}\n`;
        txt += "--------------------------------\n";
        txt += `ATENDENTE: ${operador}\n`;
        txt += "\n\n\n";
        return txt;
    };

    if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

    return (
        <DialogContent sx={{ p: 0, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Grid container sx={{ height: '100%' }}>

                {/* LISTA DE MESAS (ESQUERDA) */}
                <Grid size={4} sx={{ borderRight: '1px solid #eee', overflowY: 'auto', bgcolor: '#f8f9fa' }}>
                    <Typography variant="overline" sx={{ p: 2, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
                        MESAS ABERTAS ({orders.length})
                    </Typography>
                    <List disablePadding>
                        {orders.map(order => (
                            <ListItem key={order.id} disablePadding>
                                <ListItemButton
                                    onClick={() => setSelectedOrder(order)}
                                    selected={selectedOrder?.id === order.id}
                                    sx={{
                                        borderBottom: '1px solid #eee',
                                        bgcolor: selectedOrder?.id === order.id ? 'primary.light' : 'transparent',
                                        color: selectedOrder?.id === order.id ? 'primary.contrastText' : 'inherit',
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.light',
                                            '&:hover': { bgcolor: 'primary.light' }
                                        }
                                    }}
                                >
                                    <Box mr={2} display="flex" alignItems="center" justifyContent="center" width={40} height={40} bgcolor={selectedOrder?.id === order.id ? 'white' : 'primary.main'} borderRadius="50%" color={selectedOrder?.id === order.id ? 'primary.main' : 'white'} fontWeight="bold">
                                        {order.mesa}
                                    </Box>
                                    <ListItemText
                                        primary={<Typography fontWeight={600}>Mesa {order.mesa}</Typography>}
                                        secondary={<Typography variant="caption" sx={{ color: selectedOrder?.id === order.id ? 'white' : 'text.secondary' }}>R$ {order.total.toFixed(2)}</Typography>}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        {orders.length === 0 && (
                            <Box p={3} textAlign="center" color="text.secondary">
                                <ShoppingBag size={32} opacity={0.3} />
                                <Typography variant="caption" display="block">Nenhuma mesa aberta.</Typography>
                            </Box>
                        )}
                    </List>
                </Grid>

                {/* DETALHES E PAGAMENTO (DIREITA) */}
                <Grid size={8} sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                    {selectedOrder ? (
                        <>
                            {/* Cabeçalho do Pedido */}
                            <Box p={3} borderBottom="1px solid #eee">
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>Mesa {selectedOrder.mesa}</Typography>
                                        <Typography variant="caption" color="text.secondary">ID: {selectedOrder.id.slice(0, 8)}</Typography>
                                    </Box>
                                    <Chip label={selectedOrder.status} color="warning" size="small" />
                                </Stack>
                            </Box>

                            {/* Lista de Itens */}
                            <Box flex={1} overflow="auto" p={2}>
                                <List dense>
                                    {selectedOrder.itens.map((item, idx) => (
                                        <ListItem key={idx} disableGutters divider>
                                            <ListItemText
                                                primary={`${item.quantidade}x ${item.nome}`}
                                            />
                                            <Typography fontWeight={600}>R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>

                            {/* Área de Pagamento (Fixo no rodapé) */}
                            <Paper elevation={4} sx={{ p: 3, bgcolor: '#fafafa' }}>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography color="text.secondary">Total a Pagar</Typography>
                                        <Typography variant="h4" fontWeight={800} color="primary.main">
                                            R$ {selectedOrder.total.toFixed(2)}
                                        </Typography>
                                    </Stack>

                                    <FormControl fullWidth size="small">
                                        <InputLabel>Forma de Pagamento</InputLabel>
                                        <Select
                                            value={paymentMethod}
                                            label="Forma de Pagamento"
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <MenuItem value="Dinheiro"><Stack direction="row" gap={1} alignItems="center"><Banknote size={16} /> Dinheiro</Stack></MenuItem>
                                            <MenuItem value="Pix"><Stack direction="row" gap={1} alignItems="center"><QrCode size={16} /> Pix</Stack></MenuItem>
                                            <MenuItem value="Cartão de Crédito"><Stack direction="row" gap={1} alignItems="center"><CreditCard size={16} /> Cartão Crédito</Stack></MenuItem>
                                            <MenuItem value="Cartão de Débito"><Stack direction="row" gap={1} alignItems="center"><CreditCard size={16} /> Cartão Débito</Stack></MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        fullWidth
                                        onClick={handleFinalizar}
                                        disabled={processing}
                                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <DollarSign />}
                                    >
                                        {processing ? 'Processando...' : 'RECEBER E FINALIZAR'}
                                    </Button>
                                </Stack>
                            </Paper>
                        </>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" color="text.disabled">
                            <Receipt size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
                            <Typography>Selecione uma mesa ao lado para finalizar.</Typography>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </DialogContent>
    );
}