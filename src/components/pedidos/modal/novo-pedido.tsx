import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Box, Paper, List, ListItem, ListItemText, Divider, Select, MenuItem, FormControl, InputLabel, Chip, Snackbar, CircularProgress, Alert, Stack, IconButton } from '@mui/material';
import { PlusCircle, MinusCircle, ShoppingCart, User, Phone } from 'lucide-react';
import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

import { useCardapioStore, CardapioItem } from '@/store/cardapioStore';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';
import { db } from '@/lib/api/firebase/config';

interface ItemPedido extends CardapioItem { quantidade: number; }
const metodosPagamento = ['Pix', 'Cartão', 'Dinheiro', 'Voucher'];


export default function NovoPedidoModal() {
    const router = useRouter();
    const { itens: cardapioItens, loading: loadingCardapio, error: errorCardapio, dbReady, checkDbStatusAndInit } = useCardapioStore();

    const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [metodoPagamento, setMetodoPagamento] = useState(metodosPagamento[0]);
    const [saving, setSaving] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => { checkDbStatusAndInit(); }, [checkDbStatusAndInit]);

    const cardapioAgrupado = useMemo(() => {
        return cardapioItens.filter(i => i.disponivel).reduce((acc, item) => {
            const cat = item.categoria || 'Outros';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {} as Record<string, CardapioItem[]>);
    }, [cardapioItens]);

    const totalPedido = useMemo(() => pedidoAtual.reduce((acc, item) => acc + (item.preco * item.quantidade), 0), [pedidoAtual]);

    const adicionarItem = useCallback((item: CardapioItem) => {
        setPedidoAtual(prev => {
            const existe = prev.find(i => i.id === item.id);
            if (existe) return prev.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
            return [...prev, { ...item, quantidade: 1 }];
        });
        setSnackbarMessage(`"${item.nome}" adicionado.`);
        setSnackbarOpen(true);
    }, []);

    const removerItem = useCallback((id: number) => {
        setPedidoAtual(prev => {
            const item = prev.find(i => i.id === id);
            if (item && item.quantidade > 1) return prev.map(i => i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i);
            return prev.filter(i => i.id !== id);
        });
    }, []);

    const handleSubmit = async () => {
        if (!dbReady || !clienteNome.trim() || !clienteTelefone.trim() || pedidoAtual.length === 0) return;
        setSaving(true);
        try {
            await addDoc(collection(db as Firestore, 'pedidos'), {
                clienteNome,
                clienteTelefone,
                itens: pedidoAtual.map(i => ({ itemId: i.id, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco })),
                total: totalPedido,
                metodoPagamento,
                status: 'pendente',
                createdAt: serverTimestamp(),
            });
            setSnackbarMessage('Pedido criado com sucesso!');
            setSnackbarOpen(true);
            setTimeout(() => router.navigate({ to: '/painel/pedidos' }), 1000);
        } catch (e: any) {
            alert("Erro ao criar pedido: " + e.message);
            setSaving(false);
        }
    };

    if (loadingCardapio) return <CircularProgress />;
    if (errorCardapio) return <Alert severity="error">{errorCardapio}</Alert>;

    return (
        <Box sx={{ width: '100%', maxWidth: '1200px', margin: 'auto' }}>
            <Typography variant="h4" fontWeight={700} mb={3}>Criar Novo Pedido</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 4 }}>

                <Box sx={{ flex: 7 }}>
                    {Object.entries(cardapioAgrupado).sort().map(([cat, itens]) => (
                        <Box key={cat} mb={3}>
                            <Typography variant="h6" color="primary" mb={1}>{cat}</Typography>
                            <List dense component={Paper} variant="outlined">
                                {itens.map((item) => (
                                    <ListItem key={item.id} secondaryAction={
                                        <IconButton onClick={() => adicionarItem(item)} color="success"><PlusCircle /></IconButton>
                                    }>
                                        <ListItemText primary={item.nome} secondary={`R$ ${item.preco.toFixed(2)}`} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ flex: 5 }}>
                    <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={2}><ShoppingCart size={20} /> Pedido Atual</Typography>

                        <List dense sx={{ maxHeight: '30vh', overflowY: 'auto', mb: 2 }}>
                            {pedidoAtual.map(item => (
                                <ListItem key={item.id} secondaryAction={
                                    <Stack direction="row" alignItems="center">
                                        <IconButton size="small" onClick={() => removerItem(item.id)}><MinusCircle size={16} /></IconButton>
                                        <Typography mx={1}>{item.quantidade}</Typography>
                                        <IconButton size="small" onClick={() => adicionarItem(item)}><PlusCircle size={16} /></IconButton>
                                    </Stack>
                                }>
                                    <ListItemText primary={item.nome} secondary={`${item.quantidade}x R$ ${item.preco.toFixed(2)}`} />
                                </ListItem>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="h6">Total:</Typography>
                            <Chip label={`R$ ${totalPedido.toFixed(2)}`} color="success" sx={{ fontSize: '1.1rem', fontWeight: 700 }} />
                        </Box>

                        <Stack spacing={2}>
                            <Input label="Nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} icon={<User size={18} />} />
                            <Input label="Telefone" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} icon={<Phone size={18} />} />
                            <FormControl size="small">
                                <InputLabel>Pagamento</InputLabel>
                                <Select value={metodoPagamento} label="Pagamento" onChange={e => setMetodoPagamento(e.target.value)}>
                                    {metodosPagamento.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button variant="contained" color="success" fullWidth size="large" onClick={handleSubmit} loading={saving} disabled={saving || pedidoAtual.length === 0}>
                                Criar Pedido
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
        </Box>
    );
}