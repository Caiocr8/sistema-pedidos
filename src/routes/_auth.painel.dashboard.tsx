import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Box, Paper, Stack, Typography, CircularProgress, Chip, Avatar, LinearProgress } from '@mui/material';
import { ShoppingBag, DollarSign, CircleX, Clock, Star, TrendingUp, TrendingDown, Minus, Printer } from 'lucide-react';

import { db } from '@/lib/api/firebase/config';
import { collection, query, orderBy, onSnapshot, where, Timestamp, getDocs, doc } from 'firebase/firestore';

import { useUserStore } from '@/store/user-store';
import { getCaixaAberto, getDadosRelatorio } from '@/lib/services/caixa';
import { gerarCupomTexto, imprimirRelatorio } from '@/lib/utils/print-service';

import Button from '@/components/ui/button';
import MetricCard from '@/components/layout/dashboard/cards/metric-card';
import Modal from '@/components/ui/modal';
import VendasModalContent from '@/components/layout/dashboard/modal/vendas-modal';
import CanceladosModalContent from '@/components/layout/dashboard/modal/cancelados-modal';

interface OrderData {
    id: string;
    mesa: string;
    total: number;
    status: string;
    createdAt: any;
    itens: any[];
}

interface ProductPerformance {
    nome: string;
    qtdHoje: number;
    totalHoje: number;
    qtdOntem: number;
    trend: number;
}

function getMinutesAgo(timestamp: any): number {
    if (!timestamp) return 0;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = new Date().getTime() - date.getTime();
    return Math.floor(diffMs / 60000);
}

function formatTimeAgo(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

export const Route = createFileRoute('/_auth/painel/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    const router = useRouter();
    const { user } = useUserStore();
    const [modalOpen, setModalOpen] = useState<'vendas' | 'cancelados' | null>(null);

    const [longRunningOrders, setLongRunningOrders] = useState<OrderData[]>([]);

    // Métricas atualizadas para suportar contagem detalhada
    const [metrics, setMetrics] = useState({
        vendasHoje: 0,
        pedidosHoje: 0,
        canceladosMesas: 0,
        canceladosItens: 0
    });

    const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        setLoading(true);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const todayTs = Timestamp.fromDate(today);
        const yesterdayTs = Timestamp.fromDate(yesterday);

        // 1. LISTENER CAIXA (Vendas Hoje baseadas na SESSÃO ABERTA)
        let unsubCaixa = () => { };
        const setupCaixa = async () => {
            if (!user?.uid) return;
            const sessao = await getCaixaAberto(user.uid);

            if (sessao?.id) {
                unsubCaixa = onSnapshot(doc(db, 'caixas', sessao.id), (snap) => {
                    if (snap.exists()) {
                        const dados = snap.data();
                        // Garante que pega o total de vendas da sessão atual
                        setMetrics(prev => ({ ...prev, vendasHoje: dados.totalVendas || 0 }));
                    }
                });
            } else {
                setMetrics(prev => ({ ...prev, vendasHoje: 0 }));
            }
        };
        setupCaixa();

        // 2. PEDIDOS DO DIA (Ativos, Entregues e Cancelados)
        // Usamos uma única query para o dia de hoje para calcular Métricas de Pedidos e Cancelamentos
        const qOrdersToday = query(collection(db, 'pedidos'), where('createdAt', '>=', todayTs));

        const unsubOrders = onSnapshot(qOrdersToday, (snap) => {
            let countMesasCanceladas = 0;
            let countItensCancelados = 0;
            const activeOrders: OrderData[] = [];
            const finishedDocs: any[] = [];

            snap.docs.forEach(docSnap => {
                // CORREÇÃO AQUI: Castamos como 'any' temporariamente para evitar conflito de tipo
                // e depois construímos o objeto final explicitamente.
                const rawData = docSnap.data();
                const docId = docSnap.id;

                // Reconstrói o objeto garantindo que 'id' é o ID do documento
                const data: OrderData = {
                    ...rawData,
                    id: docId,
                    mesa: rawData.mesa,
                    total: rawData.total,
                    status: rawData.status,
                    createdAt: rawData.createdAt,
                    itens: rawData.itens || []
                };

                // A. Lógica de Cancelamento
                if (data.status === 'cancelado') {
                    countMesasCanceladas++;
                } else {
                    // Se a mesa não tá cancelada, verifica itens cancelados individualmente
                    if (data.itens && Array.isArray(data.itens)) {
                        const itensCanc = data.itens.filter((i: any) => i.cancelado === true).length;
                        countItensCancelados += itensCanc;
                    }
                }

                // B. Lógica de Pedidos Ativos (Tempo decorrido)
                if (data.status !== 'entregue' && data.status !== 'cancelado' && data.status !== 'concluido') {
                    if (getMinutesAgo(data.createdAt) >= 20) {
                        activeOrders.push(data);
                    }
                }

                // C. Lógica de Ranking (apenas entregues/pagos contam pro ranking visual, opcional)
                if (data.status === 'entregue' || data.status === 'concluido') {
                    finishedDocs.push(data);
                }
            });

            // Atualiza Estados
            setMetrics(prev => ({
                ...prev,
                canceladosMesas: countMesasCanceladas,
                canceladosItens: countItensCancelados,
                pedidosHoje: snap.size
            }));

            setLongRunningOrders(activeOrders.sort((a, b) => a.createdAt - b.createdAt));

            // D. Cálculo de Ranking (Top Produtos Hoje)
            const vendasHojeMap: Record<string, { qtd: number, total: number }> = {};
            finishedDocs.forEach(data => {
                (data.itens || []).forEach((i: any) => {
                    if (!i.cancelado) {
                        if (!vendasHojeMap[i.nome]) vendasHojeMap[i.nome] = { qtd: 0, total: 0 };
                        vendasHojeMap[i.nome].qtd += i.quantidade;
                        vendasHojeMap[i.nome].total += (i.precoUnitario * i.quantidade);
                    }
                });
            });

            // Busca dados de ontem para comparação (uma única vez)
            getDocs(query(collection(db, 'pedidos'), where('status', '==', 'entregue'), where('createdAt', '>=', yesterdayTs), where('createdAt', '<', todayTs)))
                .then(snapOntem => {
                    const vendasOntemMap: Record<string, number> = {};
                    snapOntem.forEach(doc => {
                        (doc.data().itens || []).forEach((i: any) => {
                            if (!i.cancelado) vendasOntemMap[i.nome] = (vendasOntemMap[i.nome] || 0) + i.quantidade;
                        });
                    });

                    const productsArray: ProductPerformance[] = Object.entries(vendasHojeMap).map(([nome, dados]) => ({
                        nome,
                        qtdHoje: dados.qtd,
                        totalHoje: dados.total,
                        qtdOntem: vendasOntemMap[nome] || 0,
                        trend: dados.qtd - (vendasOntemMap[nome] || 0)
                    }));

                    setTopProducts(productsArray.sort((a, b) => b.qtdHoje - a.qtdHoje).slice(0, 5));
                    setLoading(false);
                });
        });

        return () => {
            unsubCaixa();
            unsubOrders();
        };
    }, [user]);

    const handleGenerateReport = async () => {
        if (!user?.uid) return;
        setGeneratingReport(true);
        try {
            const sessao = await getCaixaAberto(user.uid);
            if (!sessao) {
                alert("Você não possui um caixa aberto no momento.");
                return;
            }
            const dados = await getDadosRelatorio(sessao);
            const texto = gerarCupomTexto(dados, 'PARCIAL', user.displayName || 'Operador');
            imprimirRelatorio(texto);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar relatório.");
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                {/* CARD VENDAS HOJE */}
                <Box onClick={() => setModalOpen('vendas')} sx={{ cursor: 'pointer' }}>
                    <MetricCard
                        title="Vendas (Caixa Aberto)"
                        value={`R$ ${metrics.vendasHoje.toFixed(2)}`}
                        badge="Ver detalhes"
                        icon={DollarSign}
                        iconColor="green"
                        bgColor="success.light"
                        valueColor="success.main"
                    />
                </Box>

                {/* CARD VOLUME TOTAL */}
                <MetricCard
                    title="Volume Total"
                    value={metrics.pedidosHoje}
                    badge="Pedidos hoje"
                    icon={ShoppingBag}
                    iconColor="#C68642"
                    bgColor="primary.light"
                    valueColor="primary.main"
                    badgeColor="primary"
                />

                {/* CARD CANCELADOS (Com Detalhes) */}
                <Box onClick={() => setModalOpen('cancelados')} sx={{ cursor: 'pointer' }}>
                    <MetricCard
                        title="Cancelados Hoje"
                        value={metrics.canceladosMesas + metrics.canceladosItens} // Soma total para destaque
                        details={`${metrics.canceladosMesas} ${metrics.canceladosMesas === 1 ? 'Mesa' : 'Mesas'} • ${metrics.canceladosItens} ${metrics.canceladosItens === 1 ? 'Item' : 'Itens'}`}
                        badge="Ver histórico"
                        icon={CircleX}
                        iconColor="#d32f2f"
                        bgColor="error.lighter"
                        valueColor="error.main"
                        badgeColor="error"
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 6fr' }, gap: 3, mb: 3 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Star size={24} color="#C68642" />
                        <Typography variant="h6" fontWeight={600}>Ranking de Vendas (Hoje)</Typography>
                    </Box>
                    <Stack spacing={3}>
                        {topProducts.length > 0 ? topProducts.map((p, i) => (
                            <Box key={p.nome}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Stack direction="row" gap={1} alignItems="center">
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: i < 3 ? 'primary.main' : 'grey.400' }}>{i + 1}</Avatar>
                                        <Typography fontWeight={600} variant="body2">{p.nome}</Typography>
                                    </Stack>
                                    <Stack direction="row" gap={2} alignItems="center">
                                        <Typography variant="caption" color="text.secondary">{p.qtdHoje} un</Typography>
                                        <Chip
                                            icon={p.trend > 0 ? <TrendingUp size={12} /> : p.trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                            label={p.trend > 0 ? `+${p.trend}` : p.trend === 0 ? '=' : p.trend}
                                            size="small"
                                            color={p.trend > 0 ? 'success' : p.trend < 0 ? 'error' : 'default'}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem', '& .MuiChip-icon': { color: 'inherit' } }}
                                        />
                                    </Stack>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(p.qtdHoje / topProducts[0].qtdHoje) * 100}
                                    sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: i < 3 ? 'primary.main' : 'grey.500' } }}
                                />
                            </Box>
                        )) : (
                            <Typography color="text.secondary" variant="body2" align="center" py={4}>Nenhuma venda registrada hoje.</Typography>
                        )}
                    </Stack>
                </Paper>

                <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderColor: 'warning.main' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Stack direction="row" gap={1} alignItems="center">
                            <Clock size={24} color="#ed6c02" />
                            <Typography variant="h6" fontWeight={600}>Mesas em Atenção</Typography>
                        </Stack>
                        <Chip label="> 20 min" size="small" color="warning" />
                    </Box>

                    {loading ? <CircularProgress /> :
                        <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {longRunningOrders.map(order => {
                                const mins = getMinutesAgo(order.createdAt);
                                return (
                                    <Paper key={order.id} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Stack direction="row" gap={2} alignItems="center">
                                            <Avatar variant="rounded" sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 'bold' }}>{order.mesa}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>Mesa {order.mesa}</Typography>
                                                <Typography variant="caption" color="text.secondary">Total: R$ {order.total.toFixed(2)}</Typography>
                                            </Box>
                                        </Stack>
                                        <Stack alignItems="flex-end">
                                            <Typography variant="h6" fontWeight={800} color="warning.main">{formatTimeAgo(mins)}</Typography>
                                            <Typography variant="caption" color="text.secondary">tempo decorrido</Typography>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                            {longRunningOrders.length === 0 && (
                                <Box py={4} textAlign="center"><Typography variant="body2" color="text.secondary">Todas as mesas estão com tempo de atendimento normal.</Typography></Box>
                            )}
                        </Stack>
                    }
                    <Button variant="outlined" fullWidth sx={{ mt: 3 }} onClick={() => router.navigate({ to: '/painel/pedidos' })}>Ver Todas as Mesas</Button>
                </Paper>
            </Box>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>Ações Rápidas</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Button variant="outlined" fullWidth onClick={() => router.navigate({ to: '/painel/cardapio' })}>Editar Cardápio</Button>
                    <Button variant="outlined" fullWidth onClick={() => router.navigate({ to: '/painel/pedidos' })}>Ver Mesas</Button>
                    <Button variant="outlined" fullWidth onClick={handleGenerateReport} startIcon={generatingReport ? <CircularProgress size={16} /> : <Printer size={16} />} disabled={loading || generatingReport} sx={{ whiteSpace: 'nowrap' }}>{generatingReport ? 'Gerando...' : 'Relatório Parcial (Caixa)'}</Button>
                </Box>
            </Paper>

            <Modal open={modalOpen === 'vendas'} onClose={() => setModalOpen(null)} title="Análise de Vendas">
                <VendasModalContent />
            </Modal>

            <Modal open={modalOpen === 'cancelados'} onClose={() => setModalOpen(null)} title="Histórico de Cancelamentos">
                <CanceladosModalContent />
            </Modal>
        </Box>
    );
}