import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Typography, Box, Paper, List, ListItem, ListItemText, Stack, IconButton,
    CircularProgress, Alert, Autocomplete, TextField, InputAdornment
} from '@mui/material';
import { PlusCircle, MinusCircle, ShoppingCart, Hash, AlertTriangle, Search } from 'lucide-react';
import {
    addDoc, collection, serverTimestamp, Firestore, query, where, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { useCardapioStore, CardapioItem } from '@/store/cardapioStore';
import { useUserStore } from '@/store/user-store'; // Importando store de usuário
import { imprimirRelatorio } from '@/lib/utils/print-service'; // Importando serviço de impressão
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';
import { db } from '@/lib/api/firebase/config';

interface ItemPedido extends CardapioItem { quantidade: number; }

export default function NovoPedidoModal({ onClose }: { onClose?: () => void }) {
    const { user } = useUserStore(); // Pegando o usuário logado (Operador)
    const { itens: cardapioItens, loading: loadingCardapio, error: errorCardapio, dbReady, checkDbStatusAndInit } = useCardapioStore();
    const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
    const [numeroMesa, setNumeroMesa] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [busca, setBusca] = useState('');

    const [mesaExistente, setMesaExistente] = useState<any | null>(null);
    const [confirmandoAdicao, setConfirmandoAdicao] = useState(false);

    useEffect(() => { checkDbStatusAndInit(); }, [checkDbStatusAndInit]);

    // --- Lógica de Impressão ---
    const imprimirComprovantePedido = (mesa: string, itens: ItemPedido[], tipo: 'ABERTURA' | 'ADICAO') => {
        const dataHora = new Date().toLocaleString('pt-BR');
        const operador = user?.displayName || 'Caixa';

        let texto = "--------------------------------\n";
        texto += `      PEDIDO - ${tipo}      \n`;
        texto += "--------------------------------\n";
        texto += `MESA: ${mesa}\n`;
        texto += `DATA: ${dataHora}\n`;
        texto += `OPERADOR: ${operador}\n`;
        texto += "--------------------------------\n";
        texto += "QTD  ITEM\n";

        itens.forEach(item => {
            texto += `${item.quantidade}x   ${item.nome}\n`;
        });

        texto += "--------------------------------\n";
        texto += "\n\n"; // Espaço para corte

        imprimirRelatorio(texto);
    };
    // ---------------------------

    const cardapioAgrupado = useMemo(() => {
        const termo = busca.toLowerCase();
        return cardapioItens
            .filter(i =>
                i.disponivel &&
                (i.nome.toLowerCase().includes(termo) || i.categoria.toLowerCase().includes(termo))
            )
            .reduce((acc, item) => {
                const cat = item.categoria || 'Outros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {} as Record<string, CardapioItem[]>);
    }, [cardapioItens, busca]);

    const opcoesAutocomplete = useMemo(() => {
        return cardapioItens.filter(i => i.disponivel);
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
            createdBy: user?.uid, // Registra quem criou
        });

        // IMPRIME APÓS SALVAR
        imprimirComprovantePedido(numeroMesa, pedidoAtual, 'ABERTURA');

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

            // IMPRIME APÓS ATUALIZAR
            imprimirComprovantePedido(numeroMesa, pedidoAtual, 'ADICAO');

            if (onClose) onClose();
        } catch (e: any) {
            alert("Erro ao atualizar mesa: " + e.message);
            setSaving(false);
        }
    };

    if (loadingCardapio) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (errorCardapio) return <Alert severity="error">{errorCardapio}</Alert>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* BUSCA */}
            <Paper elevation={0} sx={{ p: 0, bgcolor: 'transparent', flexShrink: 0 }}>
                <Autocomplete
                    options={opcoesAutocomplete}
                    getOptionLabel={(option) => option.nome}
                    inputValue={busca}
                    onInputChange={(_, newInputValue) => setBusca(newInputValue)}
                    value={null}
                    onChange={(_, newValue) => {
                        if (newValue) {
                            adicionarItem(newValue);
                            setBusca('');
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="🔍 Buscar Produto"
                            placeholder="Nome ou categoria..."
                            variant="outlined"
                            fullWidth
                            size="small"
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                            <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                                <Typography variant="body2">{option.nome}</Typography>
                                <Typography variant="caption" color="primary" fontWeight="bold">
                                    R$ {option.preco.toFixed(2)}
                                </Typography>
                            </Box>
                        </li>
                    )}
                    noOptionsText="Nenhum produto"
                    clearOnBlur={false}
                />
            </Paper>

            {/* ÁREA DE CONTEÚDO */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 3, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

                {/* LISTA ESQUERDA */}
                <Box sx={{ flex: 1.5, height: '100%', maxHeight: '60vh', overflowY: 'auto', pr: 1, opacity: confirmandoAdicao ? 0.3 : 1 }}>
                    {Object.keys(cardapioAgrupado).length === 0 ? (
                        <Box textAlign="center" mt={4} color="text.secondary">
                            <Typography variant="body2">Nenhum item encontrado.</Typography>
                        </Box>
                    ) : (
                        Object.entries(cardapioAgrupado).sort().map(([cat, itens]) => (
                            <Box key={cat} mb={2}>
                                <Typography variant="subtitle2" color="primary" fontWeight={700} mb={0.5} sx={{ textTransform: 'uppercase' }}>{cat}</Typography>
                                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    {itens.map((item, index) => (
                                        <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, px: 2, borderBottom: index < itens.length - 1 ? '1px solid #eee' : 'none', '&:hover': { bgcolor: 'action.hover' } }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                                <Typography variant="caption" color="text.secondary">R$ {item.preco.toFixed(2)}</Typography>
                                            </Box>
                                            <IconButton onClick={() => adicionarItem(item)} color="primary" size="small"><PlusCircle size={18} /></IconButton>
                                        </Box>
                                    ))}
                                </Paper>
                            </Box>
                        ))
                    )}
                </Box>

                {/* RESUMO DIREITA */}
                <Box sx={{ flex: 1, width: '100%' }}>
                    <Paper elevation={4} sx={{ p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', position: 'relative', overflow: 'hidden', height: 'auto', maxHeight: '65vh' }}>

                        {confirmandoAdicao && (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.95)', zIndex: 10, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <AlertTriangle size={40} color="#ed6c02" style={{ marginBottom: 8 }} />
                                <Typography variant="h6" fontWeight={800} color="warning.main">Mesa {numeroMesa} Ocupada</Typography>
                                <Typography variant="caption" color="text.secondary" mb={2}>
                                    Já existe conta: <strong>R$ {mesaExistente?.total?.toFixed(2)}</strong>. Juntar pedido?
                                </Typography>
                                <Stack spacing={1} width="100%">
                                    <Button variant="contained" color="warning" size="small" fullWidth onClick={adicionarAMesaExistente} loading={saving}>Confirmar</Button>
                                    <Button variant="outlined" color="error" fullWidth size="small" onClick={() => { setConfirmandoAdicao(false); setSaving(false); }}>Corrigir</Button>
                                </Stack>
                            </Box>
                        )}

                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Input
                                label="Mesa"
                                value={numeroMesa}
                                onChange={e => handleMesaChange(e.target.value)}
                                icon={<Hash size={16} />}
                                placeholder="0"
                                autoFocus
                                error={!!errorMsg}
                                inputProps={{ maxLength: 3, style: { fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', padding: '8px' } }}
                            />
                        </Box>

                        <Typography variant="overline" color="text.secondary" fontWeight={700} mb={1} fontSize="0.7rem">
                            <ShoppingCart size={12} style={{ marginRight: 4, marginBottom: -2 }} /> ITENS ({pedidoAtual.length})
                        </Typography>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', minHeight: '100px' }}>
                            <List dense>
                                {pedidoAtual.map(item => (
                                    <ListItem key={item.id} divider sx={{ py: 0.5 }}>
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight={500}>{item.nome}</Typography>}
                                            secondary={`R$ ${(item.preco * item.quantidade).toFixed(2)}`}
                                        />
                                        <Stack direction="row" alignItems="center" gap={0.5}>
                                            <IconButton size="small" onClick={() => removerItem(item.id)} sx={{ p: 0.5 }}><MinusCircle size={14} /></IconButton>
                                            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 16, textAlign: 'center' }}>{item.quantidade}</Typography>
                                            <IconButton size="small" onClick={() => adicionarItem(item)} sx={{ p: 0.5 }}><PlusCircle size={14} /></IconButton>
                                        </Stack>
                                    </ListItem>
                                ))}
                                {pedidoAtual.length === 0 && <Box p={3} textAlign="center"><Typography variant="caption" color="text.secondary">Sacola vazia</Typography></Box>}
                            </List>
                        </Box>

                        <Box mt="auto">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                                <Typography variant="h5" fontWeight={800} color="primary.main">R$ {totalPedido.toFixed(2)}</Typography>
                            </Box>
                            <Button variant="contained" color="success" fullWidth size="large" onClick={handlePreSubmit} loading={saving} disabled={saving || pedidoAtual.length === 0 || !numeroMesa}>
                                Confirmar e Imprimir
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}