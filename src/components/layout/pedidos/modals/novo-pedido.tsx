import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Typography, Box, Paper, List, ListItem, ListItemText, Stack, IconButton,
    CircularProgress, Alert, Autocomplete, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox, Divider
} from '@mui/material';
import { PlusCircle, MinusCircle, ShoppingCart, Hash, AlertTriangle, Search, Trash2 } from 'lucide-react';
import {
    addDoc, collection, serverTimestamp, Firestore, query, where, getDocs, updateDoc, doc
} from 'firebase/firestore';
import { useCardapioStore, CardapioItem } from '@/store/cardapio-store';
import { useUserStore } from '@/store/user-store';
import { imprimirPedidoCozinha } from '@/lib/utils/print-service';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';
import { db } from '@/lib/api/firebase/config';

interface ItemPedido extends CardapioItem {
    uniqueId: string; // Importante para diferenciar itens iguais com obs diferentes
    quantidade: number;
    observacoes?: string;
    adicionaisSelecionados?: { nome: string; preco: number }[];
}

export default function NovoPedidoModal({ onClose }: { onClose?: () => void }) {
    const { user } = useUserStore();
    const { itens: cardapioItens, loading: loadingCardapio, error: errorCardapio, dbReady, checkDbStatusAndInit } = useCardapioStore();

    const [pedidoAtual, setPedidoAtual] = useState<ItemPedido[]>([]);
    const [numeroMesa, setNumeroMesa] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [busca, setBusca] = useState('');

    // Configuração do Item (Modal)
    const [modalConfigOpen, setModalConfigOpen] = useState(false);
    const [itemEmConfiguracao, setItemEmConfiguracao] = useState<CardapioItem | null>(null);
    const [obsTemp, setObsTemp] = useState('');
    const [adicionaisTemp, setAdicionaisTemp] = useState<{ nome: string; preco: number }[]>([]);
    const [quantidadeTemp, setQuantidadeTemp] = useState(1);

    const [mesaExistente, setMesaExistente] = useState<any | null>(null);
    const [confirmandoAdicao, setConfirmandoAdicao] = useState(false);

    useEffect(() => { checkDbStatusAndInit(); }, [checkDbStatusAndInit]);

    // Agrupamento de itens
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

    // Cálculo do total
    const totalPedido = useMemo(() => {
        return pedidoAtual.reduce((acc, item) => {
            const totalAdicionais = item.adicionaisSelecionados?.reduce((sum, ad) => sum + ad.preco, 0) || 0;
            return acc + ((item.preco + totalAdicionais) * item.quantidade);
        }, 0);
    }, [pedidoAtual]);

    // --- Ações do Item ---
    const abrirConfiguracaoItem = (item: CardapioItem) => {
        setItemEmConfiguracao(item);
        setObsTemp('');
        setAdicionaisTemp([]);
        setQuantidadeTemp(1);
        setModalConfigOpen(true);
    };

    const confirmarItemConfigurado = () => {
        if (!itemEmConfiguracao) return;

        const novoItem: ItemPedido = {
            ...itemEmConfiguracao,
            uniqueId: `${itemEmConfiguracao.id}-${Date.now()}`,
            quantidade: quantidadeTemp,
            observacoes: obsTemp.trim() ? obsTemp : undefined,
            adicionaisSelecionados: adicionaisTemp,
        };

        setPedidoAtual(prev => [...prev, novoItem]);
        setModalConfigOpen(false);
        setItemEmConfiguracao(null);
        setBusca('');
    };

    const removerItem = (uniqueId: string) => {
        setPedidoAtual(prev => prev.filter(i => i.uniqueId !== uniqueId));
    };

    const alterarQuantidade = (uniqueId: string, delta: number) => {
        setPedidoAtual(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                const novaQtd = Math.max(1, item.quantidade + delta);
                return { ...item, quantidade: novaQtd };
            }
            return item;
        }));
    };

    const toggleAdicionalTemp = (adc: { nome: string; preco: number }) => {
        setAdicionaisTemp(prev => {
            const exists = prev.find(p => p.nome === adc.nome);
            if (exists) return prev.filter(p => p.nome !== adc.nome);
            return [...prev, adc];
        });
    };

    // --- Submit ---
    const handleMesaChange = (val: string) => {
        const numericVal = val.replace(/[^0-9]/g, '');
        if (numericVal === '') { setNumeroMesa(''); return; }
        setNumeroMesa(numericVal);
        setErrorMsg(null);
        setMesaExistente(null);
        setConfirmandoAdicao(false);
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
            alert("Erro: " + e.message);
            setSaving(false);
        }
    };

    const criarNovoPedido = async () => {
        const itensParaSalvar = pedidoAtual.map(i => ({
            itemId: i.id,
            nome: i.nome,
            quantidade: i.quantidade,
            precoUnitario: i.preco,
            observacoes: i.observacoes || null,
            adicionais: i.adicionaisSelecionados || []
        }));

        await addDoc(collection(db as Firestore, 'pedidos'), {
            mesa: numeroMesa,
            itens: itensParaSalvar,
            total: totalPedido,
            status: 'pendente',
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
        });

        imprimirPedidoCozinha(
            numeroMesa,
            pedidoAtual.map(p => ({
                nome: p.nome,
                quantidade: p.quantidade,
                observacoes: p.observacoes,
                adicionais: p.adicionaisSelecionados
            })),
            'ABERTURA',
            user?.displayName || 'Caixa'
        );

        if (onClose) onClose();
    };

    const adicionarAMesaExistente = async () => {
        if (!mesaExistente) return;
        setSaving(true);
        try {
            const pedidoRef = doc(db as Firestore, 'pedidos', mesaExistente.id);

            // CORREÇÃO: Incluindo observações e adicionais no mapeamento
            const novosItensParaSalvar = pedidoAtual.map(i => ({
                itemId: i.id,
                nome: i.nome,
                quantidade: i.quantidade,
                precoUnitario: i.preco,
                observacoes: i.observacoes || null,
                adicionais: i.adicionaisSelecionados || []
            }));

            const listaAtualizada = [...(mesaExistente.itens || []), ...novosItensParaSalvar];
            const novoTotal = (mesaExistente.total || 0) + totalPedido;

            await updateDoc(pedidoRef, {
                itens: listaAtualizada,
                total: novoTotal,
            });

            imprimirPedidoCozinha(
                numeroMesa,
                pedidoAtual.map(p => ({
                    nome: p.nome,
                    quantidade: p.quantidade,
                    observacoes: p.observacoes,
                    adicionais: p.adicionaisSelecionados
                })),
                'ADICAO',
                user?.displayName || 'Caixa'
            );

            if (onClose) onClose();
        } catch (e: any) {
            alert("Erro: " + e.message);
            setSaving(false);
        }
    };

    if (loadingCardapio) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* BUSCA */}
            <Paper elevation={0} sx={{ p: 0, bgcolor: 'transparent', flexShrink: 0 }}>
                <Autocomplete
                    options={opcoesAutocomplete}
                    getOptionLabel={(option) => option.nome}
                    inputValue={busca}
                    onInputChange={(_, v) => setBusca(v)}
                    onChange={(_, v) => v && abrirConfiguracaoItem(v)}
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
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="🔍 Buscar Produto"
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
                />
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 3, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

                {/* LISTA CARDÁPIO (ESQUERDA) */}
                <Box sx={{ flex: 1.5, height: '100%', maxHeight: '60vh', overflowY: 'auto', pr: 1, opacity: confirmandoAdicao ? 0.3 : 1 }}>
                    {Object.entries(cardapioAgrupado).sort().map(([cat, itens]) => (
                        <Box key={cat} mb={2}>
                            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{cat}</Typography>
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                {itens.map((item, idx) => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: idx < itens.length - 1 ? '1px solid #eee' : 'none' }}>
                                        <Box onClick={() => abrirConfiguracaoItem(item)} sx={{ cursor: 'pointer', flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>{item.nome}</Typography>
                                            <Typography variant="caption" color="text.secondary">R$ {item.preco.toFixed(2)}</Typography>
                                            {item.adicionais && item.adicionais.length > 0 && (
                                                <Typography variant="caption" display="block" color="primary" fontSize="0.65rem">{item.adicionais.length} opções</Typography>
                                            )}
                                        </Box>
                                        <IconButton onClick={() => abrirConfiguracaoItem(item)} color="primary" size="small"><PlusCircle size={18} /></IconButton>
                                    </Box>
                                ))}
                            </Paper>
                        </Box>
                    ))}
                </Box>

                {/* RESUMO DO PEDIDO (DIREITA) */}
                <Box sx={{ flex: 1, width: '100%' }}>
                    <Paper elevation={4} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: '65vh', position: 'relative' }}>

                        {confirmandoAdicao && (
                            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.95)', zIndex: 10, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <AlertTriangle size={40} color="#ed6c02" />
                                <Typography variant="h6" color="warning.main">Mesa {numeroMesa} Ocupada</Typography>
                                <Typography variant="caption" mb={2}>Já existe conta: <strong>R$ {mesaExistente?.total?.toFixed(2)}</strong></Typography>
                                <Stack spacing={1} width="100%">
                                    <Button variant="contained" color="warning" onClick={adicionarAMesaExistente} loading={saving}>Juntar Pedido</Button>
                                    <Button variant="outlined" color="error" onClick={() => { setConfirmandoAdicao(false); setSaving(false); }}>Cancelar</Button>
                                </Stack>
                            </Box>
                        )}

                        <Box mb={2}>
                            <Input label="Mesa" value={numeroMesa} onChange={e => handleMesaChange(e.target.value)} icon={<Hash size={16} />} placeholder="0" autoFocus inputProps={{ style: { fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' } }} />
                        </Box>

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
                            <List dense>
                                {pedidoAtual.map(item => (
                                    <ListItem key={item.uniqueId} divider>
                                        <ListItemText
                                            primary={<Typography variant="body2" fontWeight={500}>{item.nome}</Typography>}
                                            secondary={
                                                <>
                                                    {item.adicionaisSelecionados?.map((a, i) => <Typography key={i} variant="caption" display="block">+ {a.nome}</Typography>)}
                                                    {item.observacoes && <Typography variant="caption" color="warning.main" display="block">Obs: {item.observacoes}</Typography>}
                                                </>
                                            }
                                        />
                                        <Stack direction="row" alignItems="center">
                                            <IconButton size="small" onClick={() => alterarQuantidade(item.uniqueId, -1)}><MinusCircle size={14} /></IconButton>
                                            <Typography variant="body2" fontWeight={700} mx={1}>{item.quantidade}</Typography>
                                            <IconButton size="small" onClick={() => alterarQuantidade(item.uniqueId, 1)}><PlusCircle size={14} /></IconButton>
                                            <IconButton size="small" onClick={() => removerItem(item.uniqueId)} color="error" sx={{ ml: 1 }}><Trash2 size={16} /></IconButton>
                                        </Stack>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        <Box mt="auto">
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="body2">Total</Typography>
                                <Typography variant="h5" fontWeight={800} color="primary">R$ {totalPedido.toFixed(2)}</Typography>
                            </Box>
                            <Button variant="contained" color="success" fullWidth onClick={handlePreSubmit} loading={saving} disabled={pedidoAtual.length === 0 || !numeroMesa}>
                                Confirmar e Imprimir
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* MODAL CONFIG DE ADICIONAIS/OBS */}
            <Dialog open={modalConfigOpen} onClose={() => setModalConfigOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{itemEmConfiguracao?.nome}</DialogTitle>
                <DialogContent dividers>
                    <Box textAlign="center" mb={2}>
                        <IconButton onClick={() => setQuantidadeTemp(q => Math.max(1, q - 1))}><MinusCircle /></IconButton>
                        <Typography variant="h6" display="inline" mx={2}>{quantidadeTemp}</Typography>
                        <IconButton onClick={() => setQuantidadeTemp(q => q + 1)}><PlusCircle /></IconButton>
                    </Box>

                    {itemEmConfiguracao?.adicionais && itemEmConfiguracao.adicionais.length > 0 && (
                        <FormGroup>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Adicionais</Typography>
                            {itemEmConfiguracao.adicionais.map((adc, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={adicionaisTemp.some(a => a.nome === adc.nome)}
                                            onChange={() => toggleAdicionalTemp(adc)}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            {adc.nome} <span style={{ color: 'green', fontWeight: 'bold' }}>+R$ {adc.preco.toFixed(2)}</span>
                                        </Typography>
                                    }
                                />
                            ))}
                            <Divider sx={{ my: 2 }} />
                        </FormGroup>
                    )}

                    <TextField
                        label="Observações"
                        fullWidth
                        multiline
                        rows={2}
                        value={obsTemp}
                        onChange={e => setObsTemp(e.target.value)}
                        placeholder="Ex: Sem cebola, bem passado..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalConfigOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmarItemConfigurado}>Adicionar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}