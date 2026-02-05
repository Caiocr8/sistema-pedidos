import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Stack, Avatar, Divider, IconButton,
    Tooltip, Autocomplete, TextField, InputAdornment, Chip
} from '@mui/material';
import {
    Plus, Trash2, Ban, CreditCard, Search, X, AlertCircle
} from 'lucide-react';
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { useCardapioStore } from '@/store/cardapio-store'; // Verifique se é cardapioStore ou cardapio-store no seu projeto
import { cancelarPedido, cancelarItemIndividual } from '@/lib/services/pedidos';
import { imprimirPedidoCozinha } from '@/lib/utils/print-service';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import CancelarModal from './cancelar-pedido';
import TelaPagamento from './tela-pagamento';
import OrderTimer from '../cards/order-timer';

interface ComandaContentProps {
    pedido: any;
    onClose: () => void;
}

export default function ComandaContent({ pedido, onClose }: ComandaContentProps) {
    const { user } = useUserStore();
    const { itens: cardapio } = useCardapioStore();

    const [view, setView] = useState<'details' | 'payment'>('details');
    const [isAdding, setIsAdding] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    // Controle de Cancelamento
    const [cancelType, setCancelType] = useState<'mesa' | 'item' | null>(null);
    const [itemToCancel, setItemToCancel] = useState<{ index: number, name: string } | null>(null);

    const [qtdToAdd, setQtdToAdd] = useState(1);

    const itensDisponiveis = useMemo(() => {
        return cardapio.filter(item => item.disponivel === true);
    }, [cardapio]);

    // Filtra itens ativos para cálculo visual se necessário, mas o total vem do pedido
    const itensAtivos = pedido.itens.filter((i: any) => !i.cancelado);

    const handleAddItem = async (itemOverride?: any) => {
        if (!itemOverride && !isAdding) return;

        if (!itemOverride.disponivel) {
            alert("Este item está indisponível no momento.");
            return;
        }

        setLoadingAction(true);
        try {
            const produto = itemOverride;
            if (!produto) return;

            const novoItem = {
                itemId: produto.id,
                nome: produto.nome,
                precoUnitario: produto.preco,
                quantidade: qtdToAdd
            };

            // Recalcula total considerando apenas itens ativos + novo item
            const totalAtualAtivos = pedido.itens.reduce((acc: number, item: any) => {
                return item.cancelado ? acc : acc + (item.precoUnitario * item.quantidade);
            }, 0);

            const novoTotal = totalAtualAtivos + (produto.preco * qtdToAdd);

            await updateDoc(doc(db as Firestore, 'pedidos', pedido.docId), {
                itens: [...pedido.itens, novoItem],
                total: novoTotal
            });

            imprimirPedidoCozinha(
                pedido.mesa,
                [{
                    nome: produto.nome,
                    quantidade: qtdToAdd,
                    observacoes: undefined,
                    adicionais: undefined
                }],
                'ADICAO',
                user?.displayName || 'Garçom'
            );

            setQtdToAdd(1);
            // Mantém a caixa de busca aberta para adicionar mais itens rapidamente se quiser
            // setIsAdding(false); 
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleConfirmCancel = async (motivo: string) => {
        if (!user?.uid) return alert("Erro: Usuário não autenticado");
        setLoadingAction(true);
        try {
            if (cancelType === 'item' && itemToCancel) {
                await cancelarItemIndividual(pedido.docId, pedido, itemToCancel.index, motivo);
            } else if (cancelType === 'mesa') {
                await cancelarPedido(pedido.docId, motivo, user.uid);
                onClose();
            }
            setCancelType(null);
            setItemToCancel(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAction(false);
        }
    };

    if (cancelType) {
        return (
            <CancelarModal
                titulo={cancelType === 'mesa' ? "Cancelar Mesa" : "Cancelar Item"}
                descricao={cancelType === 'mesa' ? `Cancelar a Mesa ${pedido.mesa}?` : `Remover "${itemToCancel?.name}"?`}
                loading={loadingAction}
                onConfirm={handleConfirmCancel}
                onCancel={() => { setCancelType(null); setItemToCancel(null); }}
            />
        );
    }

    if (view === 'payment') {
        return <TelaPagamento pedido={pedido} onVoltar={() => setView('details')} onFinalizar={onClose} />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: { md: '700px' } }}>
            {/* Header com Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }} noPadding>
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" gap={2} alignItems="center">
                        <Box sx={{
                            bgcolor: 'white',
                            color: 'primary.main',
                            width: 56, height: 56,
                            borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '900', fontSize: '1.8rem',
                            boxShadow: 2
                        }}>
                            {pedido.mesa}
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700, letterSpacing: 1 }}>
                                MESA ABERTA
                            </Typography>
                            <Box sx={{ filter: 'brightness(1.2)' }}>
                                <OrderTimer createdAt={pedido.createdAt} status={pedido.status} large />
                            </Box>
                        </Box>
                    </Stack>
                    <Box textAlign="right">
                        <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700 }}>TOTAL</Typography>
                        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>
                            R$ {pedido.total.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Card>

            {/* Lista de Itens */}
            <Paper variant="outlined" sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Stack divider={<Divider />} spacing={0}>
                    {pedido.itens.length === 0 && (
                        <Box p={4} textAlign="center" color="text.secondary">
                            <Typography>Nenhum item lançado nesta mesa.</Typography>
                        </Box>
                    )}

                    {pedido.itens.map((item: any, i: number) => {
                        const isCancelled = item.cancelado === true;

                        return (
                            <Box
                                key={i}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    // Visual condicional para cancelados
                                    bgcolor: isCancelled ? 'action.hover' : 'inherit',
                                    opacity: isCancelled ? 0.6 : 1,
                                    '&:hover': { bgcolor: isCancelled ? 'action.hover' : 'grey.50' }
                                }}
                            >
                                <Box display="flex" gap={2} alignItems="center" flex={1}>
                                    {/* Avatar QTD */}
                                    <Avatar sx={{
                                        width: 32, height: 32, fontSize: '0.85rem',
                                        bgcolor: isCancelled ? 'grey.400' : 'action.selected',
                                        color: 'text.primary', fontWeight: 'bold'
                                    }}>
                                        {item.quantidade}
                                    </Avatar>

                                    {/* Detalhes do Item */}
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            fontWeight={isCancelled ? 500 : 600}
                                            sx={{ textDecoration: isCancelled ? 'line-through' : 'none' }}
                                        >
                                            {item.nome}
                                        </Typography>

                                        {!isCancelled ? (
                                            <Typography variant="caption" color="text.secondary">
                                                Unit: R$ {item.precoUnitario.toFixed(2)}
                                            </Typography>
                                        ) : (
                                            <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                Motivo: {item.motivoCancelamento || 'Não informado'}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Ações e Preço */}
                                <Stack direction="row" gap={3} alignItems="center">
                                    {isCancelled ? (
                                        <Chip
                                            label="CANCELADO"
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            icon={<Ban size={12} />}
                                            sx={{ height: 24, fontSize: '0.65rem', fontWeight: 'bold' }}
                                        />
                                    ) : (
                                        <Typography fontWeight={700} color="primary.main">
                                            R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                                        </Typography>
                                    )}

                                    <Box width={32} display="flex" justifyContent="flex-end">
                                        {!isCancelled && (
                                            <Tooltip title="Cancelar Item">
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={() => { setItemToCancel({ index: i, name: item.nome }); setCancelType('item'); }}
                                                    sx={{
                                                        color: 'text.secondary',
                                                        '&:hover': { color: 'error.main', bgcolor: 'error.lighter' }
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        );
                    })}
                </Stack>
            </Paper>

            {/* Área de Adicionar */}
            <Box sx={{ mb: 3 }}>
                {!isAdding ? (
                    <Button
                        variant="outlined"
                        onClick={() => setIsAdding(true)}
                        fullWidth
                        startIcon={<Plus />}
                        sx={{
                            borderStyle: 'dashed',
                            height: 48,
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.lighter' }
                        }}
                    >
                        ADICIONAR PRODUTO
                    </Button>
                ) : (
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', border: '1px solid', borderColor: 'primary.light' }}>
                        <TextField
                            label="Qtd"
                            type="number"
                            size="small"
                            value={qtdToAdd}
                            onChange={(e) => setQtdToAdd(Number(e.target.value))}
                            inputProps={{ min: 1 }}
                            sx={{ width: 80 }}
                        />
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={itensDisponiveis}
                            getOptionLabel={(option) => option.nome}
                            value={null}
                            onChange={(_, newValue) => { if (newValue) handleAddItem(newValue); }}
                            disabled={loadingAction}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Buscar e Adicionar Item"
                                    placeholder="Digite para buscar..."
                                    autoFocus
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (<InputAdornment position="start"><Search size={18} className="text-gray-400" /></InputAdornment>)
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Box display="flex" justifyContent="space-between" width="100%">
                                        <span>{option.nome}</span>
                                        <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>R$ {option.preco.toFixed(2)}</span>
                                    </Box>
                                </li>
                            )}
                            noOptionsText="Nenhum produto disponível"
                        />
                        <IconButton onClick={() => setIsAdding(false)} color="error" sx={{ bgcolor: 'error.lighter' }}><X /></IconButton>
                    </Paper>
                )}
            </Box>

            {/* Rodapé de Ações */}
            <Stack direction="row" gap={2} mt="auto">
                <Button
                    variant="text"
                    color="error"
                    onClick={() => setCancelType('mesa')}
                    startIcon={<Ban size={20} />}
                    sx={{ flex: 1, height: 56, opacity: 0.8 }}
                >
                    Cancelar Mesa
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => setView('payment')}
                    disabled={itensAtivos.length === 0 || loadingAction}
                    startIcon={<CreditCard size={20} />}
                    sx={{ flex: 2, height: 56, fontSize: '1.1rem', boxShadow: 4 }}
                >
                    Receber Pagamento
                </Button>
            </Stack>
        </Box>
    );
}