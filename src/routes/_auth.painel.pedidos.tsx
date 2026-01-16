import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Box, Paper, Chip, IconButton, Tooltip,
    FormControl, CircularProgress, Alert, Stack, Avatar,
    Divider, useTheme, Select, MenuItem, InputLabel, TextField,
    Autocomplete, InputAdornment, Button as MuiButton,
    Radio, RadioGroup, FormControlLabel, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
    Clock, DollarSign, CheckCircle, RefreshCw, XCircle, Plus,
    Timer as TimerIcon, Receipt, Trash2, CreditCard, ChevronRight, X, Ban, Search,
    ArrowLeft, Printer, Wallet, Coins, Percent, Ticket, CreditCard as CardIcon
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useCardapioStore } from '@/store/cardapioStore';
import { finalizarPedido, cancelarPedido, cancelarItemIndividual } from '@/lib/services/pedidos';
import { gerarViasRecibo, imprimirRelatorio } from '@/lib/utils/print-service';
import { useUserStore } from '@/store/user-store';
import { getCaixaAberto } from '@/lib/services/caixa';

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

// --- TELA DE PAGAMENTO OTIMIZADA ---
const TelaPagamento = ({ pedido, onVoltar, onFinalizar }: { pedido: any, onVoltar: () => void, onFinalizar: () => void }) => {
    const { user } = useUserStore();
    const [valores, setValores] = useState<Record<string, number>>({
        'Dinheiro': 0, 'Pix': 0, 'Cartão Crédito': 0, 'Cartão Débito': 0, 'Vale Refeição': 0
    });

    const [parcelas, setParcelas] = useState(1);
    const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor'>('valor');
    const [valorDescontoInput, setValorDescontoInput] = useState<string>('');
    const [docCliente, setDocCliente] = useState('');
    const [tipoDoc, setTipoDoc] = useState('CPF');
    const [loading, setLoading] = useState(false);

    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [textoViaCliente, setTextoViaCliente] = useState('');

    // --- CÁLCULOS ---
    const subtotal = pedido.total;
    let descontoCalculado = 0;
    const descInput = parseFloat(valorDescontoInput) || 0;
    if (tipoDesconto === 'porcentagem') {
        descontoCalculado = (subtotal * descInput) / 100;
    } else {
        descontoCalculado = descInput;
    }
    if (descontoCalculado > subtotal) descontoCalculado = subtotal;

    const totalComDesconto = subtotal - descontoCalculado;
    const totalPago = Object.values(valores).reduce((acc, val) => acc + val, 0);
    const saldo = totalComDesconto - totalPago;
    const troco = saldo < 0 ? Math.abs(saldo) : 0;
    const restante = saldo > 0 ? saldo : 0;
    const prontoParaFinalizar = saldo <= 0.01;

    // --- HANDLERS ---
    const handleValorChange = (metodo: string, valorStr: string) => {
        let novoValor = parseFloat(valorStr);
        if (isNaN(novoValor) || novoValor < 0) novoValor = 0;
        if (metodo !== 'Dinheiro') {
            const outrosPagamentos = Object.entries(valores)
                .filter(([key]) => key !== metodo)
                .reduce((acc, [_, val]) => acc + val, 0);
            const maxPermitido = Math.max(0, totalComDesconto - outrosPagamentos);
            if (novoValor > maxPermitido) novoValor = maxPermitido;
        }
        setValores(prev => ({ ...prev, [metodo]: novoValor }));
    };

    const handleConcluir = async () => {
        if (!user?.uid) return alert("Erro: Usuário não identificado.");

        setLoading(true);
        try {
            await finalizarPedido(
                pedido.docId,
                valores,
                {
                    troco,
                    desconto: descontoCalculado > 0 ? {
                        tipo: tipoDesconto,
                        valorInput: parseFloat(valorDescontoInput) || 0,
                        valorCalculado: descontoCalculado
                    } : undefined,
                    totalFinal: totalComDesconto,
                    parcelas: valores['Cartão Crédito'] > 0 ? parcelas : 1
                },
                user.uid,
                user.displayName || 'Operador'
            );

            // Geração das Vias Separadas
            const vias = gerarViasRecibo(
                { ...pedido, total: subtotal, valorOriginal: subtotal },
                valores,
                troco,
                docCliente,
                tipoDoc,
                descontoCalculado > 0 ? { valorCalculado: descontoCalculado } : undefined,
                valores['Cartão Crédito'] > 0 ? parcelas : 1
            );

            // Imprime via do estabelecimento automaticamente
            imprimirRelatorio(vias.viaEstabelecimento);

            // Abre modal para via do cliente
            setTextoViaCliente(vias.viaCliente);
            setModalClienteOpen(true);
            setLoading(false);

        } catch (error) {
            console.error(error);
            alert("Erro ao finalizar pedido. Verifique se o caixa está aberto.");
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onVoltar} size="small"><ArrowLeft /></IconButton>
                <Typography variant="h5" fontWeight={700}>Pagamento / Fechamento</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                <Stack spacing={2} sx={{ flex: 1.5, overflowY: 'auto', pr: 1 }}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Ticket size={18} className="text-orange-500" />
                            <Typography variant="subtitle2" fontWeight={700}>Desconto</Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <ToggleButtonGroup
                                value={tipoDesconto}
                                exclusive
                                onChange={(_, v) => v && setTipoDesconto(v)}
                                size="small"
                                sx={{ height: 40 }}
                            >
                                <ToggleButton value="valor" sx={{ px: 2 }}>R$</ToggleButton>
                                <ToggleButton value="porcentagem" sx={{ px: 2 }}><Percent size={14} /></ToggleButton>
                            </ToggleButtonGroup>
                            <TextField
                                placeholder={tipoDesconto === 'porcentagem' ? "0%" : "0,00"}
                                type="number"
                                size="small"
                                fullWidth
                                value={valorDescontoInput}
                                onChange={(e) => setValorDescontoInput(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">
                                        {tipoDesconto === 'valor' ? 'R$' : ''}
                                    </InputAdornment>,
                                    endAdornment: tipoDesconto === 'porcentagem' ? <InputAdornment position="end">%</InputAdornment> : null
                                }}
                            />
                        </Stack>
                        {descontoCalculado > 0 && (
                            <Typography variant="caption" color="success.main" fontWeight={600} mt={1} display="block">
                                Desconto aplicado: - R$ {descontoCalculado.toFixed(2)}
                            </Typography>
                        )}
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={2}>Formas de Pagamento</Typography>
                        <Stack spacing={2}>
                            {Object.keys(valores).map((metodo) => {
                                const isDinheiro = metodo === 'Dinheiro';
                                const isCredito = metodo === 'Cartão Crédito';
                                const isFilled = valores[metodo] > 0;
                                const pagoOutros = Object.entries(valores).filter(([k]) => k !== metodo).reduce((a, b) => a + b[1], 0);
                                const falta = Math.max(0, totalComDesconto - pagoOutros);

                                return (
                                    <Box key={metodo} display="flex" alignItems="center" gap={2}>
                                        <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                                            {isDinheiro ? <Coins size={20} className="text-green-600" /> :
                                                metodo === 'Pix' ? <img src="https://img.icons8.com/color/48/pix.png" width={20} alt="pix" style={{ filter: 'grayscale(100%)' }} /> :
                                                    <CreditCard size={20} className="text-gray-400" />}
                                            <Typography variant="body2" fontWeight={isFilled ? 600 : 400} color={isFilled ? 'text.primary' : 'text.secondary'}>
                                                {metodo}
                                            </Typography>
                                        </Box>
                                        {isCredito && (
                                            <FormControl size="small" sx={{ width: 90 }}>
                                                <Select
                                                    value={parcelas}
                                                    onChange={(e) => setParcelas(Number(e.target.value))}
                                                    displayEmpty
                                                    sx={{ fontSize: '0.875rem' }}
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                                                        <MenuItem key={p} value={p}>{p}x</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}
                                        <TextField
                                            placeholder={falta > 0 && !isDinheiro ? `Máx ${falta.toFixed(2)}` : "0,00"}
                                            type="number"
                                            size="small"
                                            value={valores[metodo] === 0 ? '' : valores[metodo]}
                                            onChange={(e) => handleValorChange(metodo, e.target.value)}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><Typography fontSize={12} color="text.secondary">R$</Typography></InputAdornment>,
                                            }}
                                            sx={{
                                                width: 130,
                                                '& input': { fontWeight: 'bold', textAlign: 'right' }
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Paper>

                    <Box sx={{ pt: 1 }}>
                        <Typography variant="caption" color="text.secondary" onClick={() => setDocCliente(prev => prev ? '' : ' ')} sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                            {docCliente === '' && 'Adicionar CPF/CNPJ na nota?'}
                        </Typography>
                        {docCliente !== '' && (
                            <Paper elevation={0} variant="outlined" sx={{ p: 1.5, mt: 1, borderRadius: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                                    <RadioGroup row value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                                        <FormControlLabel value="CPF" control={<Radio size="small" />} label={<Typography variant="caption">CPF</Typography>} />
                                        <FormControlLabel value="CNPJ" control={<Radio size="small" />} label={<Typography variant="caption">CNPJ</Typography>} />
                                    </RadioGroup>
                                </Stack>
                                <TextField
                                    placeholder="Digite o documento" fullWidth size="small"
                                    value={docCliente === ' ' ? '' : docCliente}
                                    onChange={(e) => setDocCliente(e.target.value)}
                                />
                            </Paper>
                        )}
                    </Box>
                </Stack>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={4} sx={{
                        p: 3,
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>RESUMO DO PEDIDO</Typography>
                            <Box mt={2}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography>R$ {subtotal.toFixed(2)}</Typography>
                                </Box>
                                {descontoCalculado > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1} color="error.main">
                                        <Typography>Desconto</Typography>
                                        <Typography>- R$ {descontoCalculado.toFixed(2)}</Typography>
                                    </Box>
                                )}
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                    <Typography variant="h6" fontWeight={700}>TOTAL A PAGAR</Typography>
                                    <Typography variant="h4" fontWeight={800} color="primary.main">R$ {totalComDesconto.toFixed(2)}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ my: 4, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Valor Recebido</Typography>
                                <Typography variant="body1" fontWeight={600} color="success.main">R$ {totalPago.toFixed(2)}</Typography>
                            </Box>

                            {troco > 0 ? (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} borderTop="1px dashed #ccc">
                                    <Typography variant="subtitle1" color="primary.main" fontWeight={700}>TROCO</Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">R$ {troco.toFixed(2)}</Typography>
                                </Box>
                            ) : (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} borderTop="1px dashed #ccc">
                                    <Typography variant="body2" color="text.secondary">Faltam</Typography>
                                    <Typography variant="h6" fontWeight={700} color={restante > 0 ? "error.main" : "text.disabled"}>
                                        R$ {restante.toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            color={prontoParaFinalizar ? "success" : "inherit"}
                            size="large"
                            disabled={!prontoParaFinalizar || loading}
                            onClick={handleConcluir}
                            startIcon={<Printer />}
                            loading={loading}
                            sx={{ height: 60, fontSize: '1.1rem', boxShadow: prontoParaFinalizar ? 4 : 0 }}
                        >
                            {prontoParaFinalizar ? 'FINALIZAR E IMPRIMIR' : 'AGUARDANDO PAGAMENTO'}
                        </Button>
                    </Paper>
                </Box>
            </Box>

            <StyledModal
                open={modalClienteOpen}
                onClose={() => { setModalClienteOpen(false); onFinalizar(); }}
                title="Impressão de Recibo"
            >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Pagamento Registrado com Sucesso!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        A via do estabelecimento foi impressa. Deseja imprimir a <b>Via do Cliente</b>?
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="large"
                            onClick={() => { setModalClienteOpen(false); onFinalizar(); }}
                            startIcon={<X />}
                            sx={{ minWidth: 140 }}
                        >
                            Não (Fechar)
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={() => { imprimirRelatorio(textoViaCliente); setModalClienteOpen(false); onFinalizar(); }}
                            startIcon={<Printer />}
                            sx={{ minWidth: 140 }}
                        >
                            Sim, Imprimir
                        </Button>
                    </Stack>
                </Box>
            </StyledModal>
        </Box>
    );
};

const ComandaContent = ({ pedido, onClose }: { pedido: any, onClose: () => void }) => {
    const { user } = useUserStore();
    const { itens: cardapio } = useCardapioStore();
    const [view, setView] = useState<'details' | 'payment'>('details');
    const [isAdding, setIsAdding] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [cancelType, setCancelType] = useState<'mesa' | 'item' | null>(null);
    const [itemToCancel, setItemToCancel] = useState<{ index: number, name: string } | null>(null);
    const [qtdToAdd, setQtdToAdd] = useState(1);

    const handleAddItem = async (itemOverride?: any) => {
        if (!itemOverride && !isAdding) return;
        setLoadingAction(true);
        try {
            const produto = itemOverride;
            if (!produto) return;

            // 1. Atualizar Banco
            const novoItem = { itemId: produto.id, nome: produto.nome, precoUnitario: produto.preco, quantidade: qtdToAdd };
            const novoTotal = pedido.total + (produto.preco * qtdToAdd);
            await updateDoc(doc(db as Firestore, 'pedidos', pedido.docId), { itens: [...pedido.itens, novoItem], total: novoTotal });

            // 2. IMPRIMIR CUPOM DE ADIÇÃO (COZINHA/BAR)
            const txtImpressao = [
                "--------------------------------",
                "      ADICAO DE ITEM            ",
                "--------------------------------",
                `MESA: ${pedido.mesa}`,
                `DATA: ${new Date().toLocaleTimeString()}`,
                `OPER: ${user?.displayName || 'Garçom'}`,
                "--------------------------------",
                `+ ${qtdToAdd}x  ${produto.nome}`,
                "--------------------------------",
                "\n\n"
            ].join("\n");

            imprimirRelatorio(txtImpressao);

            setQtdToAdd(1);
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
            setCancelType(null); setItemToCancel(null);
        } catch (error) { console.error(error); } finally { setLoadingAction(false); }
    };

    if (cancelType) {
        return <CancelarModal titulo={cancelType === 'mesa' ? "Cancelar Mesa" : "Cancelar Item"} descricao={cancelType === 'mesa' ? `Cancelar a Mesa ${pedido.mesa}?` : `Remover "${itemToCancel?.name}"?`} loading={loadingAction} onConfirm={handleConfirmCancel} onCancel={() => { setCancelType(null); setItemToCancel(null); }} />;
    }

    if (view === 'payment') {
        return <TelaPagamento pedido={pedido} onVoltar={() => setView('details')} onFinalizar={onClose} />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: { md: '700px' } }}>
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
                        <TextField label="Qtd" type="number" size="small" value={qtdToAdd} onChange={(e) => setQtdToAdd(Number(e.target.value))} inputProps={{ min: 1 }} sx={{ width: 70 }} />
                        <Autocomplete
                            fullWidth size="small"
                            options={cardapio.filter(i => i.disponivel)}
                            getOptionLabel={(option) => option.nome}
                            value={null}
                            onChange={(_, newValue) => { if (newValue) handleAddItem(newValue); }}
                            disabled={loadingAction}
                            renderInput={(params) => (
                                <TextField {...params} label="Buscar e Adicionar Item" placeholder="Digite para buscar..." autoFocus InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><Search size={18} className="text-gray-400" /></InputAdornment>) }} />
                            )}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <Box display="flex" justifyContent="space-between" width="100%">
                                        <span>{option.nome}</span>
                                        <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>R$ {option.preco.toFixed(2)}</span>
                                    </Box>
                                </li>
                            )}
                            noOptionsText="Nenhum produto encontrado"
                        />
                        <IconButton onClick={() => setIsAdding(false)}><X /></IconButton>
                    </Paper>
                )}
            </Box>

            <Stack direction="row" gap={2} mt="auto">
                <Button variant="text" color="error" onClick={() => setCancelType('mesa')} startIcon={<Ban size={20} />} sx={{ flex: 1, height: 56 }}>Cancelar Mesa</Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => setView('payment')}
                    disabled={pedido.total === 0 || loadingAction}
                    startIcon={<CreditCard size={20} />}
                    sx={{ flex: 2, height: 56, fontSize: '1.1rem' }}
                >
                    Receber Pagamento
                </Button>
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

    const [verificandoCaixa, setVerificandoCaixa] = useState(false);
    const { user } = useUserStore();

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

    const handleAbrirNovaMesa = async () => {
        if (!user?.uid) return;

        setVerificandoCaixa(true);
        try {
            const caixa = await getCaixaAberto(user.uid);
            if (!caixa) {
                alert("⚠️ CAIXA FECHADO\n\nÉ necessário abrir o caixa antes de iniciar um novo pedido.");
            } else {
                setNovoOpen(true);
            }
        } catch (error) {
            console.error("Erro ao verificar caixa:", error);
            alert("Erro ao verificar status do caixa.");
        } finally {
            setVerificandoCaixa(false);
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', width: '100%', mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box>
                    <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 1 }}>Controle de Mesas</Typography>
                    <Typography variant="body1" color="text.secondary">{mesasAtivas} {mesasAtivas === 1 ? 'mesa ativa' : 'mesas ativas'}</Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<Plus size={24} />}
                    onClick={handleAbrirNovaMesa}
                    loading={verificandoCaixa}
                    sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                    Nova Mesa
                </Button>
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