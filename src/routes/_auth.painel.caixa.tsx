import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Stack, CircularProgress, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert,
    Divider, TextField, InputAdornment
} from '@mui/material';
import {
    Wallet, TrendingUp, TrendingDown, Lock, Unlock,
    ArrowRightLeft, DollarSign, Printer, AlertTriangle, Calendar
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import {
    abrirCaixa, registrarMovimentacao, subscribeToHistorico,
    getDadosRelatorio, fecharCaixaCompleto,
    CaixaSessao, Movimentacao, RelatorioData
} from '@/lib/services/caixa';
import { gerarCupomTexto, imprimirRelatorio } from '@/lib/utils/print-service';

import Button from '@/components/ui/button';
import StyledModal from '@/components/ui/modal';
import Input from '@/components/forms/input';

export const Route = createFileRoute('/_auth/painel/caixa')({
    component: CaixaPage,
})

// --- COMPONENTES AUXILIARES ---

const StatCard = ({ title, value, icon: Icon, color, subvalue }: any) => (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>{title}</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: `${color}.main` }}>
                    {typeof value === 'number' ? `R$ ${value.toFixed(2)}` : value}
                </Typography>
            </Box>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main`, opacity: 0.8 }}>
                <Icon size={24} />
            </Box>
        </Box>
        {subvalue && <Typography variant="caption" color="text.secondary">{subvalue}</Typography>}
    </Paper>
);

const AbrirCaixaModal = ({ open, onClose, onConfirm, loading }: any) => {
    const [valor, setValor] = useState('');
    return (
        <StyledModal open={open} onClose={onClose} title="Abertura de Caixa">
            <Box component="form" onSubmit={(e) => { e.preventDefault(); onConfirm(Number(valor)); }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Informe o valor em dinheiro presente na gaveta para iniciar o turno.
                </Alert>
                <Input
                    label="Valor Inicial (R$)"
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    autoFocus
                    fullWidth
                    required
                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                />
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                    <Button type="submit" loading={loading} variant="contained" startIcon={<Unlock />}>Abrir Caixa</Button>
                </Box>
            </Box>
        </StyledModal>
    );
};

const MovimentacaoModal = ({ type, open, onClose, onConfirm, loading }: any) => {
    const [valor, setValor] = useState('');
    const [motivo, setMotivo] = useState('');
    const isSangria = type === 'sangria';

    return (
        <StyledModal open={open} onClose={onClose} title={isSangria ? "Nova Sangria" : "Novo Suprimento"}>
            <Box component="form" onSubmit={(e) => { e.preventDefault(); onConfirm(Number(valor), motivo); }}>
                <Alert severity={isSangria ? "warning" : "success"} icon={isSangria ? <TrendingDown /> : <TrendingUp />} sx={{ mb: 3 }}>
                    {isSangria
                        ? "Retirada de dinheiro (ex: pagamento, vale)."
                        : "Entrada de dinheiro extra (ex: troco)."}
                </Alert>
                <Stack spacing={3}>
                    <Input
                        label="Valor (R$)"
                        type="number"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        fullWidth
                        required
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                    />
                    <Input
                        label="Motivo / Descrição"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        fullWidth
                        required
                        placeholder={isSangria ? "Ex: Pagamento Fornecedor" : "Ex: Troco adicional"}
                    />
                </Stack>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                    <Button type="submit" loading={loading} variant="contained" color={isSangria ? "error" : "success"}>Confirmar</Button>
                </Box>
            </Box>
        </StyledModal>
    );
};

const FecharCaixaModal = ({ open, onClose, sessao, onConfirm, loading }: any) => {
    const [step, setStep] = useState(1); // 1: Load, 2: Conferência
    const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
    const [confDinheiro, setConfDinheiro] = useState('');
    const [confCartao, setConfCartao] = useState('');
    const [obs, setObs] = useState('');

    useEffect(() => {
        if (open && sessao) {
            setStep(1);
            setConfDinheiro('');
            setConfCartao('');
            setObs('');
            getDadosRelatorio(sessao).then(data => {
                setRelatorio(data);
                setStep(2);
            });
        }
    }, [open, sessao]);

    const handleConfirm = () => {
        if (!relatorio) return;
        const dinheiro = parseFloat(confDinheiro) || 0;
        const cartao = parseFloat(confCartao) || 0;

        const dadosFinais = {
            ...relatorio,
            fechamento: {
                dinheiroContado: dinheiro,
                cartaoPixContado: cartao,
                totalGeralContado: dinheiro + cartao,
                diferenca: (dinheiro + cartao) - relatorio.esperado.totalGeral,
                observacoes: obs
            }
        };
        onConfirm(dadosFinais);
    };

    const difTotal = relatorio ? ((parseFloat(confDinheiro) || 0) + (parseFloat(confCartao) || 0)) - relatorio.esperado.totalGeral : 0;

    return (
        <StyledModal open={open} onClose={onClose} title="Fechamento de Caixa">
            {step === 1 && <Box p={4} textAlign="center"><CircularProgress /> <Typography mt={2}>Consolidando dados...</Typography></Box>}

            {step === 2 && relatorio && (
                <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Confira os valores na gaveta e na maquineta antes de encerrar.
                    </Alert>

                    <Grid container spacing={3}>
                        {/* Coluna Esquerda: Esperado */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', height: '100%' }}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">ESPERADO (SISTEMA)</Typography>
                                <Stack spacing={1.5} mt={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2">Dinheiro (Gaveta):</Typography>
                                        <Typography variant="body2" fontWeight={700}>R$ {relatorio.esperado.dinheiro.toFixed(2)}</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2">Cartão/Pix:</Typography>
                                        <Typography variant="body2" fontWeight={700}>R$ {relatorio.esperado.cartaoPix.toFixed(2)}</Typography>
                                    </Box>
                                    <Divider sx={{ borderStyle: 'dashed' }} />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="subtitle1" fontWeight={800}>TOTAL:</Typography>
                                        <Typography variant="subtitle1" fontWeight={800}>R$ {relatorio.esperado.totalGeral.toFixed(2)}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Coluna Direita: Conferência */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom mb={2}>CONFERÊNCIA (REAL)</Typography>
                            <Stack spacing={2}>
                                <Input
                                    label="Dinheiro Contado"
                                    type="number"
                                    value={confDinheiro}
                                    onChange={(e) => setConfDinheiro(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                    fullWidth
                                    focused
                                />
                                <Input
                                    label="Total Maquineta (Cartão+Pix)"
                                    type="number"
                                    value={confCartao}
                                    onChange={(e) => setConfCartao(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                    fullWidth
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    {/* Resumo da Diferença */}
                    <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: Math.abs(difTotal) < 0.05 ? 'success.light' : difTotal > 0 ? 'info.light' : 'error.light', color: Math.abs(difTotal) < 0.05 ? 'success.dark' : difTotal > 0 ? 'info.dark' : 'error.dark' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            {Math.abs(difTotal) >= 0.05 && <AlertTriangle size={24} />}
                            <Box flex={1}>
                                <Typography variant="subtitle2" fontWeight={800}>
                                    DIFERENÇA: {difTotal > 0 ? '+' : ''}R$ {difTotal.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" fontWeight={600}>
                                    {Math.abs(difTotal) < 0.05 ? 'Caixa batendo corretamente.' : difTotal < 0 ? 'Falta de caixa (Quebra).' : 'Sobra de caixa.'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <TextField
                        label="Observações do Fechamento"
                        multiline
                        rows={2}
                        fullWidth
                        sx={{ mt: 3 }}
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                        placeholder="Justifique diferenças se houver..."
                    />

                    <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                        <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                        <Button onClick={handleConfirm} loading={loading} variant="contained" color="primary" startIcon={<Lock />}>
                            Encerrar Caixa
                        </Button>
                    </Box>
                </Box>
            )}
        </StyledModal>
    );
};

// --- PÁGINA PRINCIPAL ---

function CaixaPage() {
    const { user } = useUserStore();
    const [sessao, setSessao] = useState<CaixaSessao | null>(null);
    const [historico, setHistorico] = useState<CaixaSessao[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Estados dos Modais
    const [modalAbertura, setModalAbertura] = useState(false);
    const [modalSangria, setModalSangria] = useState(false);
    const [modalSuprimento, setModalSuprimento] = useState(false);
    const [modalFechamento, setModalFechamento] = useState(false);

    // 1. Escuta a sessão ativa
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db as Firestore, 'caixa_sessoes'), where('usuarioId', '==', user.uid), where('status', '==', 'aberto'));
        const unsubscribe = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setSessao({ id: snap.docs[0].id, ...snap.docs[0].data() } as CaixaSessao);
            } else {
                setSessao(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, [user?.uid]);

    // 2. Escuta histórico
    useEffect(() => {
        const unsubscribe = subscribeToHistorico((data) => setHistorico(data));
        return unsubscribe;
    }, []);

    // 3. Escuta movimentações da sessão atual
    useEffect(() => {
        if (!sessao?.id) { setMovimentacoes([]); return; }
        const q = query(collection(db as Firestore, 'caixa_movimentacoes'), where('sessaoId', '==', sessao.id), orderBy('data', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setMovimentacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Movimentacao)));
        });
        return unsubscribe;
    }, [sessao?.id]);

    // --- HANDLERS ---

    const handleAbrirCaixa = async (valor: number) => {
        if (!user) return;
        setActionLoading(true);
        try { await abrirCaixa(user.uid, user.displayName || 'Usuário', valor); setModalAbertura(false); }
        catch (error) { console.error(error); alert("Erro ao abrir"); } finally { setActionLoading(false); }
    };

    const handleMovimentacao = async (valor: number, motivo: string, tipo: 'sangria' | 'suprimento') => {
        if (!sessao?.id || !user) return;
        setActionLoading(true);
        try { await registrarMovimentacao(sessao.id, user.uid, tipo, valor, motivo, sessao.saldoAtual); if (tipo === 'sangria') setModalSangria(false); else setModalSuprimento(false); }
        catch (error) { console.error(error); alert("Erro"); } finally { setActionLoading(false); }
    };

    const handleImprimirParcial = async () => {
        if (!sessao) return;
        setActionLoading(true);
        try {
            const dados = await getDadosRelatorio(sessao);
            const texto = gerarCupomTexto(dados, 'PARCIAL', user?.displayName || 'Op');
            imprimirRelatorio(texto);
        } catch (error) { console.error(error); alert("Erro ao gerar relatório"); } finally { setActionLoading(false); }
    };

    const handleConfirmarFechamento = async (dadosCompletos: RelatorioData) => {
        if (!sessao?.id || !dadosCompletos.fechamento) return;
        setActionLoading(true);
        try {
            await fecharCaixaCompleto(
                sessao.id,
                dadosCompletos,
                {
                    dinheiro: dadosCompletos.fechamento.dinheiroContado,
                    cartaoPix: dadosCompletos.fechamento.cartaoPixContado,
                    obs: dadosCompletos.fechamento.observacoes
                }
            );

            // Imprime relatório final automaticamente
            const texto = gerarCupomTexto(dadosCompletos, 'FECHAMENTO', user?.displayName || 'Op');
            imprimirRelatorio(texto);

            setModalFechamento(false);
        } catch (error) { console.error(error); alert("Erro ao fechar"); } finally { setActionLoading(false); }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, pb: 10, maxWidth: 1200, mx: 'auto' }}>

            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 3 }}>
                Controle de Caixa
            </Typography>

            {!sessao ? (
                // --- CAIXA FECHADO ---
                <Paper sx={{ p: 6, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 4 }}>
                    <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: '50%', mb: 2 }}>
                        <Wallet size={48} className="text-gray-400" />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>O caixa está fechado</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>
                        Para iniciar as vendas e registrar movimentações, você precisa abrir uma nova sessão de caixa.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => setModalAbertura(true)} startIcon={<Unlock />}>
                        Abrir Caixa Agora
                    </Button>
                </Paper>
            ) : (
                // --- CAIXA ABERTO ---
                <Box mb={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Chip label="SESSÃO ATIVA" color="success" size="small" icon={<Unlock size={14} />} sx={{ fontWeight: 700, px: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                                Aberto em: {sessao.dataAbertura?.toDate().toLocaleString()}
                            </Typography>
                        </Stack>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                            <Button variant="outlined" color="secondary" size="small" startIcon={<Printer />} onClick={handleImprimirParcial} loading={actionLoading}>
                                Rel. Parcial
                            </Button>
                            <Button variant="outlined" color="error" size="small" startIcon={<TrendingDown />} onClick={() => setModalSangria(true)}>
                                Sangria
                            </Button>
                            <Button variant="outlined" color="success" size="small" startIcon={<TrendingUp />} onClick={() => setModalSuprimento(true)}>
                                Suprimento
                            </Button>
                            <Button variant="contained" color="primary" size="small" startIcon={<Lock />} onClick={() => setModalFechamento(true)}>
                                Fechar Caixa
                            </Button>
                        </Stack>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <StatCard title="SALDO FÍSICO (DINHEIRO)" value={sessao.saldoAtual} icon={DollarSign} color="success" subvalue="Em gaveta" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <StatCard title="FUNDO DE TROCO" value={sessao.valorInicial} icon={Wallet} color="primary" subvalue="Valor inicial" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <StatCard title="MOVIMENTAÇÕES" value={movimentacoes.length} icon={ArrowRightLeft} color="info" subvalue="Registros hoje" />
                        </Grid>
                    </Grid>

                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.selected', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={700}>Movimentações Recentes</Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: 250 }}>
                            <Table size="small" stickyHeader>
                                <TableBody>
                                    {movimentacoes.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                                {m.data?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={m.tipo.toUpperCase()} size="small"
                                                    color={m.tipo === 'sangria' ? 'error' : m.tipo === 'suprimento' ? 'success' : 'default'}
                                                    variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.9rem' }}>{m.descricao}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: m.tipo === 'sangria' ? 'error.main' : 'success.main' }}>
                                                {m.tipo === 'sangria' ? '- ' : '+ '}R$ {m.valor.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {movimentacoes.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Nenhuma movimentação ainda.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Calendar size={20} className="text-primary-main" />
                    <Typography variant="h6" fontWeight={700}>Histórico de Sessões</Typography>
                </Box>

                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Operador</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Abertura</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Fechamento</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historico.map((h) => {
                                    const isOpen = h.status === 'aberto';
                                    return (
                                        <TableRow key={h.id} hover selected={isOpen}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {h.dataAbertura?.toDate().toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {h.dataAbertura?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {h.dataFechamento ? ` - ${h.dataFechamento.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{h.usuarioNome}</TableCell>
                                            <TableCell align="right">R$ {h.valorInicial.toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                {h.valorFinal !== undefined
                                                    ? <Typography variant="body2" fontWeight={700} color="success.main">R$ {h.valorFinal.toFixed(2)}</Typography>
                                                    : <Typography variant="caption" color="text.secondary">--</Typography>
                                                }
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={isOpen ? "ABERTO" : "FECHADO"}
                                                    color={isOpen ? "success" : "default"}
                                                    size="small"
                                                    variant={isOpen ? "filled" : "outlined"}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {historico.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Nenhum histórico encontrado.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>

            {/* Modais */}
            <AbrirCaixaModal open={modalAbertura} onClose={() => setModalAbertura(false)} onConfirm={handleAbrirCaixa} loading={actionLoading} />
            <MovimentacaoModal type="sangria" open={modalSangria} onClose={() => setModalSangria(false)} onConfirm={(v: number, m: string) => handleMovimentacao(v, m, 'sangria')} loading={actionLoading} />
            <MovimentacaoModal type="suprimento" open={modalSuprimento} onClose={() => setModalSuprimento(false)} onConfirm={(v: number, m: string) => handleMovimentacao(v, m, 'suprimento')} loading={actionLoading} />
            <FecharCaixaModal open={modalFechamento} onClose={() => setModalFechamento(false)} sessao={sessao} onConfirm={handleConfirmarFechamento} loading={actionLoading} />
        </Box>
    );
} 