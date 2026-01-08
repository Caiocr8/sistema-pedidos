import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Typography, Box, Paper, List, ListItem, ListItemText, Stack, IconButton,
    CircularProgress, Alert
} from '@mui/material';
import { PlusCircle, MinusCircle, ShoppingCart, Hash, AlertTriangle, CheckCircle } from 'lucide-react';
import {
    addDoc, collection, serverTimestamp, Firestore, query, where, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { useCardapioStore, CardapioItem } from '@/store/cardapioStore';
import Input from '@/components/forms/input';
import StyledButton from '@/components/ui/button'; // Seu botão personalizado
import { db } from '@/lib/api/firebase/config';

interface ItemPedido extends CardapioItem { quantidade: number; }

export default function NovoPedidoModal({ onClose }: { onClose?: () => void }) {
    const { itens: cardapioItens, loading: loadingCardapio, error: errorCardapio, dbReady, checkDbStatusAndInit } = useCardapioStore();
    const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
    const [numeroMesa, setNumeroMesa] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Estados para Controle de Mesa Duplicada
    const [mesaExistente, setMesaExistente] = useState<any | null>(null);
    const [confirmandoAdicao, setConfirmandoAdicao] = useState(false);

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

    const handleMesaChange = (val: string) => {
        const numericVal = val.replace(/[^0-9]/g, '');
        if (numericVal === '') { setNumeroMesa(''); return; }
        const num = parseInt(numericVal, 10);
        if (num >= 1 && num <= 100) {
            setNumeroMesa(numericVal);
            setErrorMsg(null);
            setMesaExistente(null);
            setConfirmandoAdicao(false);
        }
    };

    const handlePreSubmit = async () => {
        if (!dbReady || !numeroMesa || pedidoAtual.length === 0) return;
        setSaving(true);

        try {
            const q = query(
                collection(db as Firestore, 'pedidos'),
                where('mesa', '==', numeroMesa),
                where('status', 'in', ['pendente', 'em_preparo', 'a_caminho'])
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docFound = querySnapshot.docs[0];
                setMesaExistente({ id: docFound.id, ...docFound.data() });
                setConfirmandoAdicao(true);
                setSaving(false);
                return;
            }

            await criarNovoPedido();

        } catch (e: any) {
            alert("Erro ao verificar mesa: " + e.message);
            setSaving(false);
        }
    };

    const criarNovoPedido = async () => {
        await addDoc(collection(db as Firestore, 'pedidos'), {
            mesa: numeroMesa,
            itens: pedidoAtual.map(i => ({
                itemId: i.id, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco
            })),
            total: totalPedido,
            status: 'pendente',
            createdAt: serverTimestamp(),
        });
        if (onClose) onClose();
    };

    const adicionarAMesaExistente = async () => {
        if (!mesaExistente) return;
        setSaving(true);
        try {
            const pedidoRef = doc(db as Firestore, 'pedidos', mesaExistente.id);
            const novosItensParaSalvar = pedidoAtual.map(i => ({
                itemId: i.id, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco
            }));
            const listaAtualizada = [...(mesaExistente.itens || []), ...novosItensParaSalvar];
            const novoTotal = (mesaExistente.total || 0) + totalPedido;

            await updateDoc(pedidoRef, {
                itens: listaAtualizada,
                total: novoTotal,
            });

            if (onClose) onClose();
        } catch (e: any) {
            alert("Erro ao atualizar mesa: " + e.message);
            setSaving(false);
        }
    };

    if (loadingCardapio) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (errorCardapio) return <Alert severity="error">{errorCardapio}</Alert>;

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 4, height: '100%' }}>
            <Box sx={{ flex: 1.5, maxHeight: '65vh', overflowY: 'auto', pr: 1, opacity: confirmandoAdicao ? 0.3 : 1, pointerEvents: confirmandoAdicao ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
                {Object.entries(cardapioAgrupado).sort().map(([cat, itens]) => (
                    <Box key={cat} mb={3}>
                        <Typography variant="subtitle1" color="primary" fontWeight={700} mb={1} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</Typography>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            {itens.map((item, index) => (
                                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: index < itens.length - 1 ? '1px solid #eee' : 'none', '&:hover': { bgcolor: 'action.hover' } }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                        <Typography variant="caption" color="text.secondary">R$ {item.preco.toFixed(2)}</Typography>
                                    </Box>
                                    <IconButton onClick={() => adicionarItem(item)} color="primary" size="small" sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}><PlusCircle size={18} /></IconButton>
                                </Box>
                            ))}
                        </Paper>
                    </Box>
                ))}
            </Box>

            <Box sx={{ flex: 1 }}>
                <Paper elevation={4} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>

                    {confirmandoAdicao && (
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            bgcolor: 'rgba(255,255,255,0.98)', zIndex: 10, p: 4,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                        }}>
                            <AlertTriangle size={56} color="#ed6c02" style={{ marginBottom: 16 }} />
                            <Typography variant="h5" fontWeight={800} color="warning.main" gutterBottom>
                                Atenção: Mesa {numeroMesa} Ocupada
                            </Typography>
                            <Typography variant="body1" color="text.secondary" mb={4} sx={{ maxWidth: 300 }}>
                                Já existe uma conta aberta com <strong>R$ {mesaExistente?.total?.toFixed(2)}</strong>.
                                <br />
                                Deseja juntar o pedido novo?
                            </Typography>

                            <Stack spacing={2} width="100%">
                                <StyledButton
                                    variant="contained"
                                    color="warning"
                                    size="large"
                                    fullWidth
                                    onClick={adicionarAMesaExistente}
                                    startIcon={<CheckCircle />}
                                    loading={saving}
                                >
                                    Confirmar Adição
                                </StyledButton>
                                {/* Agora usando seu Button personalizado */}
                                <StyledButton
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    size="large"
                                    onClick={() => { setConfirmandoAdicao(false); setSaving(false); }}
                                >
                                    Não, Corrigir Número
                                </StyledButton>
                            </Stack>
                        </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Input label="Mesa" value={numeroMesa} onChange={e => handleMesaChange(e.target.value)} icon={<Hash size={18} />} placeholder="Ex: 5" autoFocus error={!!errorMsg} helperText={errorMsg} inputProps={{ maxLength: 3, style: { fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' } }} />
                    </Box>

                    <Typography variant="overline" color="text.secondary" fontWeight={700} mb={1}>
                        <ShoppingCart size={14} style={{ marginRight: 4, marginBottom: -2 }} /> ITENS SELECIONADOS
                    </Typography>

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <List dense>
                            {pedidoAtual.map(item => (
                                <ListItem key={item.id} divider>
                                    <ListItemText primary={item.nome} secondary={`R$ ${(item.preco * item.quantidade).toFixed(2)}`} primaryTypographyProps={{ fontWeight: 500 }} />
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <IconButton size="small" onClick={() => removerItem(item.id)}><MinusCircle size={16} /></IconButton>
                                        <Typography fontWeight={700}>{item.quantidade}</Typography>
                                        <IconButton size="small" onClick={() => adicionarItem(item)}><PlusCircle size={16} /></IconButton>
                                    </Stack>
                                </ListItem>
                            ))}
                            {pedidoAtual.length === 0 && <Box p={4} textAlign="center"><Typography variant="caption" color="text.secondary">Adicione itens do cardápio</Typography></Box>}
                        </List>
                    </Box>

                    <Box mt="auto">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body1" color="text.secondary">Total</Typography>
                            <Typography variant="h4" fontWeight={800} color="primary.main">R$ {totalPedido.toFixed(2)}</Typography>
                        </Box>
                        <StyledButton variant="contained" color="success" fullWidth size="large" onClick={handlePreSubmit} loading={saving} disabled={saving || pedidoAtual.length === 0 || !numeroMesa}>
                            Confirmar Pedido
                        </StyledButton>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}