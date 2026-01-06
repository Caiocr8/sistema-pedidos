import { useRouter } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Box, Paper, List, ListItem, ListItemText, Divider, Chip, Snackbar, CircularProgress, Alert, Stack, IconButton } from '@mui/material';
import { PlusCircle, MinusCircle, ShoppingCart, Hash } from 'lucide-react';
import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';
import { useCardapioStore, CardapioItem } from '@/store/cardapioStore';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';
import { db } from '@/lib/api/firebase/config';

interface ItemPedido extends CardapioItem { quantidade: number; }

// Adicionei a prop onClose
export default function NovoPedidoModal({ onClose }: { onClose?: () => void }) {
    const router = useRouter();
    const { itens: cardapioItens, loading: loadingCardapio, error: errorCardapio, dbReady, checkDbStatusAndInit } = useCardapioStore();
    const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
    const [numeroMesa, setNumeroMesa] = useState('');
    const [saving, setSaving] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // Novo estado para erro local

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
    }, []);

    const removerItem = useCallback((id: number) => {
        setPedidoAtual(prev => {
            const item = prev.find(i => i.id === id);
            if (item && item.quantidade > 1) return prev.map(i => i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i);
            return prev.filter(i => i.id !== id);
        });
    }, []);

    // --- Validação da Mesa ---
    const handleMesaChange = (val: string) => {
        // Remove tudo que não for número
        const numericVal = val.replace(/[^0-9]/g, '');

        // Se vazio, ok
        if (numericVal === '') {
            setNumeroMesa('');
            return;
        }

        const num = parseInt(numericVal, 10);
        // Só aceita entre 1 e 100
        if (num >= 1 && num <= 100) {
            setNumeroMesa(numericVal);
            setErrorMsg(null);
        } else {
            // Opcional: mostrar erro ou só ignorar
            setErrorMsg("Mesa deve ser entre 1 e 100");
        }
    };

    const handleSubmit = async () => {
        if (!dbReady || !numeroMesa || pedidoAtual.length === 0) return;
        setSaving(true);
        try {
            await addDoc(collection(db as Firestore, 'pedidos'), {
                mesa: numeroMesa,
                itens: pedidoAtual.map(i => ({
                    itemId: i.id, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco
                })),
                total: totalPedido,
                status: 'pendente',
                createdAt: serverTimestamp(),
            });

            // FECHA O MODAL
            if (onClose) onClose();

        } catch (e: any) {
            alert("Erro ao criar pedido: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loadingCardapio) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (errorCardapio) return <Alert severity="error">{errorCardapio}</Alert>;

    return (
        <Box sx={{ width: '100%', minWidth: { md: '900px' } }}> {/* Aumentei largura do modal */}
            <Typography variant="h4" fontWeight={700} mb={3}>Abrir Nova Mesa</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 4 }}>

                {/* Coluna Esquerda: Cardápio */}
                <Box sx={{ flex: 7, maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
                    {Object.entries(cardapioAgrupado).sort().map(([cat, itens]) => (
                        <Box key={cat} mb={3}>
                            <Typography variant="h6" color="primary" mb={1} fontWeight={600}>{cat}</Typography>
                            <List dense component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                {itens.map((item) => (
                                    <ListItem key={item.id} divider secondaryAction={
                                        <IconButton onClick={() => adicionarItem(item)} color="success" size="small" sx={{ bgcolor: 'success.light', color: 'white', '&:hover': { bgcolor: 'success.main' } }}><PlusCircle size={20} /></IconButton>
                                    }>
                                        <ListItemText
                                            primary={<Typography fontWeight={500}>{item.nome}</Typography>}
                                            secondary={`R$ ${item.preco.toFixed(2)}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ))}
                </Box>

                {/* Coluna Direita: Resumo e Mesa */}
                <Box sx={{ flex: 5 }}>
                    <Paper elevation={4} sx={{ p: 3, position: 'sticky', top: 0, borderRadius: 3 }}>
                        <Stack spacing={3}>
                            <Box>
                                <Input
                                    label="Número da Mesa (1-100)"
                                    value={numeroMesa}
                                    onChange={e => handleMesaChange(e.target.value)}
                                    icon={<Hash size={18} />}
                                    placeholder="Ex: 5"
                                    autoFocus
                                    error={!!errorMsg}
                                    helperText={errorMsg}
                                    inputProps={{ maxLength: 3, style: { fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' } }}
                                />
                            </Box>

                            <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2, minHeight: 200, maxHeight: 300, overflowY: 'auto' }}>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>PEDIDO ATUAL</Typography>
                                <List dense>
                                    {pedidoAtual.map(item => (
                                        <ListItem key={item.id} disableGutters secondaryAction={
                                            <Stack direction="row" alignItems="center" gap={1}>
                                                <IconButton size="small" onClick={() => removerItem(item.id)}><MinusCircle size={16} /></IconButton>
                                                <Typography fontWeight={700}>{item.quantidade}</Typography>
                                                <IconButton size="small" onClick={() => adicionarItem(item)}><PlusCircle size={16} /></IconButton>
                                            </Stack>
                                        }>
                                            <ListItemText primary={item.nome} secondary={`R$ ${(item.preco * item.quantidade).toFixed(2)}`} />
                                        </ListItem>
                                    ))}
                                    {pedidoAtual.length === 0 && <Typography variant="body2" color="text.secondary" align="center" py={4}>Nenhum item selecionado</Typography>}
                                </List>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Total Estimado</Typography>
                                <Typography variant="h4" fontWeight={800} color="primary.main">R$ {totalPedido.toFixed(2)}</Typography>
                            </Box>

                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                size="large"
                                onClick={handleSubmit}
                                loading={saving}
                                disabled={saving || pedidoAtual.length === 0 || !numeroMesa}
                                sx={{ py: 1.5, fontSize: '1.1rem' }}
                            >
                                Confirmar e Abrir
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}