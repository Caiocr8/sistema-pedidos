import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stack, CircularProgress, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Divider, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
    Wallet, TrendingDown, Lock, Unlock, DollarSign,
    Calendar, Plus, Edit, Coins, MoreVertical, FileText, ChevronDown
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { useCaixaStore } from '@/store/caixa-store';
import {
    abrirCaixa,
    registrarMovimentacaoManual,
    subscribeToHistorico,
    getDadosRelatorio,
    fecharCaixa,
    atualizarOperador,
    CaixaSessao,
    Movimentacao,
    RelatorioData
} from '@/lib/services/caixa';
import { gerarCupomTexto, gerarReciboTrocaOperador, imprimirRelatorio } from '@/lib/utils/print-service';

// Componentes
import Button from '@/components/ui/button';
import StatCard from '@/components/layout/caixa/cards/stat-card';
import AbrirCaixaModal from '@/components/layout/caixa/modals/abrir-caixa-modal';
import MovimentacaoModal from '@/components/layout/caixa/modals/movimentacao-modal';
import FecharCaixaModal from '@/components/layout/caixa/modals/fechar-caixa-modal';
import EditarOperadorModal from '@/components/layout/caixa/modals/editar-operador-modal';

export const Route = createFileRoute('/_auth/painel/caixa')({
    component: CaixaPage,
})

function CaixaPage() {
    const { user } = useUserStore();
    const { setCaixaAberto, setCaixaFechado } = useCaixaStore();

    const [sessao, setSessao] = useState<CaixaSessao | null>(null);
    const [historico, setHistorico] = useState<CaixaSessao[]>([]);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Menu de Ações
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);

    // Modais
    const [modalAbertura, setModalAbertura] = useState(false);
    const [modalSangria, setModalSangria] = useState(false);
    const [modalSuprimento, setModalSuprimento] = useState(false);
    const [modalFechamento, setModalFechamento] = useState(false);
    const [modalOperador, setModalOperador] = useState(false);

    // Métricas
    const [totalVendas, setTotalVendas] = useState(0);
    const [totalVendasDinheiro, setTotalVendasDinheiro] = useState(0);

    // --- EFFECTS ---
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db as Firestore, 'caixa_sessoes'), where('usuarioId', '==', user.uid), where('status', '==', 'aberto'));
        return onSnapshot(q, (snap) => {
            setSessao(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as CaixaSessao);
            setLoading(false);
        });
    }, [user?.uid]);

    useEffect(() => subscribeToHistorico((data: CaixaSessao[]) => setHistorico(data)), []);

    useEffect(() => {
        if (!sessao?.id) { setMovimentacoes([]); return; }
        const q = query(collection(db as Firestore, 'caixa_movimentacoes'), where('sessaoId', '==', sessao.id), orderBy('data', 'desc'));

        return onSnapshot(q, (snap) => {
            const movs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Movimentacao));
            setMovimentacoes(movs);

            let vendasDin = 0;
            let vendasTotal = 0;
            let totalSangrias = 0;
            let totalSuprimentos = 0;

            movs.forEach(m => {
                if (m.tipo === 'venda') {
                    vendasTotal += m.valor;
                    if (m.formaPagamento === 'Dinheiro') vendasDin += m.valor;
                } else if (m.tipo === 'sangria') {
                    totalSangrias += m.valor;
                } else if (m.tipo === 'suprimento') {
                    totalSuprimentos += m.valor;
                }
            });

            setTotalVendas(vendasTotal);
            // Dinheiro Líquido = Vendas Dinheiro + Suprimentos Extras - Sangrias
            setTotalVendasDinheiro(vendasDin + totalSuprimentos - totalSangrias);
        });
    }, [sessao?.id]);

    // --- HANDLERS ---
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleMenuAction = (action: () => void) => { handleMenuClose(); action(); };

    const handleAbrirCaixa = async (valor: number, operador: string) => {
        if (!user) return;
        setActionLoading(true);
        try {
            const novoId = await abrirCaixa(user.uid, operador, valor);
            setCaixaAberto(novoId);
            setModalAbertura(false);
        } catch (error) { console.error(error); alert("Erro ao abrir"); } finally { setActionLoading(false); }
    };

    const handleMovimentacao = async (valor: number, motivo: string, tipo: 'sangria' | 'suprimento') => {
        if (!sessao?.id || !user) return;
        setActionLoading(true);
        try {
            await registrarMovimentacaoManual(sessao.id, user.uid, tipo, valor, motivo);
            if (tipo === 'sangria') setModalSangria(false); else setModalSuprimento(false);
        } catch (error) { console.error(error); alert("Erro ao movimentar"); } finally { setActionLoading(false); }
    };

    const handleTrocarOperador = async (novoNome: string) => {
        if (!sessao?.id || !user) return;
        setActionLoading(true);
        try {
            await atualizarOperador(sessao.id, novoNome, user.uid);
            imprimirRelatorio(gerarReciboTrocaOperador(sessao.usuarioNome, novoNome, new Date()));
            setModalOperador(false);
        } catch (error) { console.error(error); alert("Erro ao trocar operador"); } finally { setActionLoading(false); }
    };

    const handleImprimirParcial = async () => {
        if (!sessao) return;
        setActionLoading(true);
        try {
            const dados = await getDadosRelatorio(sessao);
            // Injeta as movimentações atuais para garantir consistência no print
            const dadosCompletos = { ...dados, movimentacoes: movimentacoes };
            imprimirRelatorio(gerarCupomTexto(dadosCompletos, 'PARCIAL', sessao.usuarioNome));
        } catch (error) { console.error(error); alert("Erro ao gerar relatório"); } finally { setActionLoading(false); }
    };

    const handleConfirmarFechamento = async (dadosCompletos: RelatorioData) => {
        if (!sessao?.id || !dadosCompletos.fechamento) return;
        setActionLoading(true);
        try {
            await fecharCaixa(sessao.id, {
                dinheiro: dadosCompletos.fechamento.dinheiroContado,
                cartao: dadosCompletos.fechamento.cartaoPixContado,
                pix: 0,
                obs: dadosCompletos.fechamento.observacoes
            }, dadosCompletos);
            setCaixaFechado();
            imprimirRelatorio(gerarCupomTexto(dadosCompletos, 'FECHAMENTO', sessao.usuarioNome));
            setModalFechamento(false);
        } catch (error) { console.error(error); alert("Erro ao fechar caixa."); } finally { setActionLoading(false); }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, pb: 10, maxWidth: 1200, mx: 'auto', width: '100%' }}>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 3, fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>
                Controle de Caixa
            </Typography>

            {!sessao ? (
                <Paper sx={{ p: 6, mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 4 }}>
                    <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: '50%', mb: 2 }}>
                        <Wallet size={48} className="text-gray-400" />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>O caixa está fechado</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>
                        Para iniciar as vendas, identifique o operador e informe o fundo de troco.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => setModalAbertura(true)} startIcon={<Unlock />}>
                        Abrir Caixa Agora
                    </Button>
                </Paper>
            ) : (
                <Box mb={6}>
                    {/* CABEÇALHO */}
                    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                        <Stack direction="row" alignItems="center" gap={2} sx={{ justifyContent: { xs: 'space-between', sm: 'flex-start' } }}>
                            <Stack direction="row" alignItems="center" gap={2}>
                                <Chip label="CAIXA ABERTO" color="success" size="small" icon={<Unlock size={14} />} sx={{ fontWeight: 800, px: 1 }} />
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                            </Stack>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1} mb={0.5}>OPERADOR ATUAL</Typography>
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <Typography variant="body1" fontWeight={700}>{sessao.usuarioNome}</Typography>
                                    <Tooltip title="Trocar Operador">
                                        <IconButton size="small" onClick={() => setModalOperador(true)} sx={{ bgcolor: 'action.hover', width: 24, height: 24 }}><Edit size={14} /></IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>
                        </Stack>
                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button variant="contained" color="primary" startIcon={<MoreVertical size={18} />} endIcon={<ChevronDown size={18} />} onClick={handleMenuClick} disabled={actionLoading} fullWidth sx={{ justifyContent: 'space-between' }}>
                                Ações do Caixa
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={handleMenuClose}
                                PaperProps={{ elevation: 4, sx: { mt: 1, minWidth: 220, borderRadius: 2 } }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={() => handleMenuAction(handleImprimirParcial)}><ListItemIcon><FileText size={18} /></ListItemIcon><ListItemText>Relatório Parcial</ListItemText></MenuItem>
                                <Divider />
                                <MenuItem onClick={() => handleMenuAction(() => setModalSuprimento(true))}><ListItemIcon><Plus size={18} color="green" /></ListItemIcon><ListItemText>Adicionar Dinheiro</ListItemText></MenuItem>
                                <MenuItem onClick={() => handleMenuAction(() => setModalSangria(true))}><ListItemIcon><TrendingDown size={18} color="red" /></ListItemIcon><ListItemText>Realizar Sangria</ListItemText></MenuItem>
                                <Divider />
                                <MenuItem onClick={() => handleMenuAction(() => setModalFechamento(true))}><ListItemIcon><Lock size={18} className="text-primary-main" /></ListItemIcon><ListItemText primaryTypographyProps={{ fontWeight: 700, color: 'primary.main' }}>Fechar Caixa</ListItemText></MenuItem>
                            </Menu>
                        </Box>
                    </Paper>

                    {/* CARDS ORGANIZADOS COM STACK (Alternativa ao Grid) */}
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={3}
                        sx={{ mb: 3 }}
                    >
                        {/* 1. SALDO (SESSÃO) = Vendas Brutas */}
                        <Box flex={1}>
                            <StatCard
                                title="SALDO (SESSÃO)"
                                value={totalVendas}
                                icon={DollarSign}
                                color="success"
                                subvalue="Total de vendas realizadas"
                            />
                        </Box>

                        {/* 2. SUPRIMENTO = Fundo Fixo */}
                        <Box flex={1}>
                            <StatCard
                                title="SUPRIMENTO"
                                value={sessao.valorInicial}
                                icon={Lock}
                                color="primary"
                                subvalue="Valor inicial (Fixo)"
                            />
                        </Box>

                        {/* 3. VENDAS EM ESPÉCIE = Dinheiro Líquido */}
                        <Box flex={1}>
                            <StatCard
                                title="VENDAS EM ESPÉCIE"
                                value={totalVendasDinheiro}
                                icon={Coins}
                                color="info"
                                secondaryInfo={
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Representatividade:</Typography>
                                        <Typography variant="caption" display="block" color="text.primary" fontWeight={700}>
                                            {totalVendas > 0 ? ((totalVendasDinheiro / totalVendas) * 100).toFixed(1) : 0}% do faturamento total
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </Stack>

                    {/* TABELA DE MOVIMENTAÇÕES */}
                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={700}>Movimentações Recentes</Typography>
                            <Typography variant="caption" color="text.secondary">Últimos lançamentos</Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableBody>
                                    {movimentacoes.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma movimentação registrada.</TableCell></TableRow>
                                    ) : (
                                        movimentacoes.map((m) => (
                                            <TableRow key={m.id} hover>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', width: 100 }}>
                                                    {m.data?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell sx={{ width: 120 }}>
                                                    <Chip label={m.tipo.toUpperCase()} size="small" color={m.tipo === 'sangria' ? 'error' : m.tipo === 'suprimento' ? 'success' : 'default'} variant="outlined" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, minWidth: 80 }} />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.875rem' }}>{m.descricao || '-'}</TableCell>
                                                <TableCell align="right">
                                                    {m.tipo === 'sistema' ? (
                                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>-</Typography>
                                                    ) : (
                                                        <Typography variant="body2" fontWeight={700} color={m.tipo === 'sangria' ? 'error.main' : 'success.main'}>
                                                            {m.tipo === 'sangria' ? '- ' : '+ '} R$ {m.valor.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* HISTÓRICO */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Calendar size={20} className="text-primary-main" />
                    <Typography variant="h6" fontWeight={700}>Histórico de Fechamentos</Typography>
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
                                {historico.map((h: any) => {
                                    const isOpen = h.status === 'aberto';
                                    const valorFinalDisplay = h.valorFinal ?? h.resumoFechamento?.totalGeralContado;
                                    return (
                                        <TableRow key={h.id} hover selected={isOpen}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{h.dataAbertura?.toDate().toLocaleDateString()}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {h.dataAbertura?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {h.dataFechamento ? ` - ${h.dataFechamento.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{h.usuarioNome}</TableCell>
                                            <TableCell align="right">R$ {h.valorInicial.toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                {valorFinalDisplay !== undefined ? <Typography variant="body2" fontWeight={700} color="success.main">R$ {Number(valorFinalDisplay).toFixed(2)}</Typography> : <Typography variant="caption" color="text.secondary">--</Typography>}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={isOpen ? "ABERTO" : "FECHADO"} color={isOpen ? "success" : "default"} size="small" variant={isOpen ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />
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

            <AbrirCaixaModal open={modalAbertura} onClose={() => setModalAbertura(false)} onConfirm={handleAbrirCaixa} loading={actionLoading} userNameDefault={user?.displayName} />
            <MovimentacaoModal type="sangria" open={modalSangria} onClose={() => setModalSangria(false)} onConfirm={(v: number, m: string) => handleMovimentacao(v, m, 'sangria')} loading={actionLoading} />
            <MovimentacaoModal type="suprimento" open={modalSuprimento} onClose={() => setModalSuprimento(false)} onConfirm={(v: number, m: string) => handleMovimentacao(v, m, 'suprimento')} loading={actionLoading} />

            {/* Passamos movimentações para o modal de fechamento */}
            <FecharCaixaModal
                open={modalFechamento}
                onClose={() => setModalFechamento(false)}
                sessao={sessao}
                onConfirm={handleConfirmarFechamento}
                loading={actionLoading}
                movimentacoes={movimentacoes}
            />
            {sessao && <EditarOperadorModal open={modalOperador} onClose={() => setModalOperador(false)} onConfirm={handleTrocarOperador} atual={sessao.usuarioNome} loading={actionLoading} />}
        </Box>
    );
}