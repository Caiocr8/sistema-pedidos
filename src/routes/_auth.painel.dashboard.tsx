import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Box, Paper, Stack, Typography, CircularProgress, Chip, Avatar, LinearProgress } from '@mui/material';
import { ShoppingBag, DollarSign, CircleX, Clock, Star, TrendingUp, TrendingDown, Minus, Printer } from 'lucide-react';

// Firebase
import { db } from '@/lib/api/firebase/config';
import { collection, query, orderBy, onSnapshot, where, Timestamp, getDocs } from 'firebase/firestore';

// Store e Serviços (Integração com Caixa)
import { useUserStore } from '@/store/user-store';
import { getCaixaAberto, getDadosRelatorio } from '@/lib/services/caixa';
import { gerarCupomTexto, imprimirRelatorio } from '@/lib/utils/print-service';

// Componentes
import Button from '@/components/ui/button';
import MetricCard from '@/components/layout/dashboard/metric-card';
import StyledModal from '@/components/ui/modal';
import VendasModalContent from '@/components/layout/dashboard/modal/vendas-modal';
import CanceladosModalContent from '@/components/layout/dashboard/modal/cancelados-modal';

// Tipagem
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
    trend: number; // Diferença (Hoje - Ontem)
}

// Interface para Métricas de Pagamento
interface PaymentStats {
    [key: string]: number; // Ex: { pix: 150.00, dinheiro: 50.00 }
}

// Helper de Tempo
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
    const { user } = useUserStore(); // Recupera usuário logado para buscar o caixa dele
    const [modalOpen, setModalOpen] = useState<'vendas' | 'cancelados' | null>(null);

    // Estados de Dados
    const [longRunningOrders, setLongRunningOrders] = useState<OrderData[]>([]);
    const [metrics, setMetrics] = useState({ vendasHoje: 0, pedidosHoje: 0, canceladosHoje: 0 });
    const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para o botão de imprimir
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        setLoading(true);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

        const todayTs = Timestamp.fromDate(today);
        const yesterdayTs = Timestamp.fromDate(yesterday);

        // QUERIES
        const qActive = query(collection(db, 'pedidos'), orderBy('createdAt', 'asc')); // Mais antigos primeiro
        const qFinishedToday = query(collection(db, 'pedidos_finalizados'), where('finishedAt', '>=', todayTs));
        const qFinishedYesterday = query(collection(db, 'pedidos_finalizados'), where('finishedAt', '>=', yesterdayTs), where('finishedAt', '<', todayTs));
        const qCancelledToday = query(collection(db, 'pedidos_cancelados'), where('cancelledAt', '>=', todayTs));

        // 1. Monitorar Pedidos Ativos (Longa Duração)
        const unsubActive = onSnapshot(qActive, (snap) => {
            const longOrders = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as OrderData))
                .filter(order => {
                    const minutes = getMinutesAgo(order.createdAt);
                    return minutes >= 20; // Filtro: Apenas mesas abertas há mais de 20 min
                });
            setLongRunningOrders(longOrders);
        });

        // 2. Monitorar Cancelados Hoje
        const unsubCancelled = onSnapshot(qCancelledToday, (snap) => {
            setMetrics(prev => ({ ...prev, canceladosHoje: snap.size }));
        });

        // 3. Processar Vendas (Hoje vs Ontem) para Métricas e Top Produtos
        getDocs(qFinishedYesterday).then(snapOntem => {
            const vendasOntemMap: Record<string, number> = {};
            snapOntem.forEach(doc => {
                const itens = doc.data().itens || [];
                itens.forEach((i: any) => {
                    vendasOntemMap[i.nome] = (vendasOntemMap[i.nome] || 0) + i.quantidade;
                });
            });

            // Listener de Hoje
            const unsubFinished = onSnapshot(qFinishedToday, (snapHoje) => {
                let totalVendas = 0;
                const vendasHojeMap: Record<string, { qtd: number, total: number }> = {};

                snapHoje.forEach(doc => {
                    const data = doc.data();
                    totalVendas += data.total || 0;

                    // Agregação de Produtos
                    const itens = data.itens || [];
                    itens.forEach((i: any) => {
                        if (!vendasHojeMap[i.nome]) vendasHojeMap[i.nome] = { qtd: 0, total: 0 };
                        vendasHojeMap[i.nome].qtd += i.quantidade;
                        vendasHojeMap[i.nome].total += (i.precoUnitario * i.quantidade);
                    });
                });

                // Montar Lista de Produtos com Comparação
                const productsArray: ProductPerformance[] = Object.entries(vendasHojeMap).map(([nome, dados]) => ({
                    nome,
                    qtdHoje: dados.qtd,
                    totalHoje: dados.total,
                    qtdOntem: vendasOntemMap[nome] || 0,
                    trend: dados.qtd - (vendasOntemMap[nome] || 0)
                }));

                setTopProducts(productsArray.sort((a, b) => b.qtdHoje - a.qtdHoje).slice(0, 5));

                setMetrics(prev => ({
                    ...prev,
                    vendasHoje: totalVendas,
                    pedidosHoje: snapHoje.size
                }));
                setLoading(false);
            });

            return () => unsubFinished();
        });

        return () => {
            unsubActive();
            unsubCancelled();
        };
    }, []);

    const totalPedidosDia = metrics.pedidosHoje + longRunningOrders.length + metrics.canceladosHoje;

    // --- FUNÇÃO DE GERAÇÃO DE RELATÓRIO (PARCIAL DO CAIXA) ---
    const handleGenerateReport = async () => {
        if (!user?.uid) return;
        setGeneratingReport(true);
        try {
            // 1. Busca a sessão de caixa ativa do usuário logado
            const sessao = await getCaixaAberto(user.uid);

            if (!sessao) {
                alert("Você não possui um caixa aberto no momento. Abra o caixa na tela 'Caixa' para gerar relatórios.");
                return;
            }

            // 2. Calcula os dados do relatório (parcial)
            const dados = await getDadosRelatorio(sessao);

            // 3. Gera o texto no formato de cupom
            const texto = gerarCupomTexto(dados, 'PARCIAL', user.displayName || 'Operador');

            // 4. Aciona a impressão
            imprimirRelatorio(texto);

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao tentar gerar o relatório parcial. Tente novamente.");
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                <Box onClick={() => setModalOpen('vendas')} sx={{ cursor: 'pointer' }}>
                    <MetricCard
                        title="Vendas Hoje"
                        value={`R$ ${metrics.vendasHoje.toFixed(2)}`}
                        badge="Ver detalhes" icon={DollarSign} iconColor="green" bgColor="success.light" valueColor="success.main"
                    />
                </Box>
                <MetricCard
                    title="Volume Total"
                    value={totalPedidosDia}
                    badge="Mesas hoje" icon={ShoppingBag} iconColor="#C68642" bgColor="primary.light" valueColor="primary.main" badgeColor="primary"
                />
                <Box onClick={() => setModalOpen('cancelados')} sx={{ cursor: 'pointer' }}>
                    <MetricCard
                        title="Cancelados Hoje"
                        value={metrics.canceladosHoje}
                        badge="Ver motivos" icon={CircleX} iconColor="red" bgColor="error.light" valueColor="error.dark" badgeColor="error"
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 6fr' }, gap: 3, mb: 3 }}>

                {/* 1. TOP PRODUTOS (Gráfico + Tendência) */}
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

                                        {/* Badge de Tendência */}
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

                {/* 2. MESAS EM ALERTA (> 20 min) */}
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
                                            <Avatar variant="rounded" sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 'bold' }}>
                                                {order.mesa}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>Mesa {order.mesa}</Typography>
                                                <Typography variant="caption" color="text.secondary">Total: R$ {order.total.toFixed(2)}</Typography>
                                            </Box>
                                        </Stack>
                                        <Stack alignItems="flex-end">
                                            <Typography variant="h6" fontWeight={800} color="warning.main">
                                                {formatTimeAgo(mins)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">tempo decorrido</Typography>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                            {longRunningOrders.length === 0 && (
                                <Box py={4} textAlign="center">
                                    <Typography variant="body2" color="text.secondary">Todas as mesas estão com tempo de atendimento normal.</Typography>
                                </Box>
                            )}
                        </Stack>
                    }

                    <Button variant="outlined" fullWidth sx={{ mt: 3 }} onClick={() => router.navigate({ to: '/painel/pedidos' })}>
                        Ver Todas as Mesas
                    </Button>
                </Paper>
            </Box>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>Ações Rápidas</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Button variant="outlined" fullWidth onClick={() => router.navigate({ to: '/painel/cardapio' })}>Editar Cardápio</Button>
                    <Button variant="outlined" fullWidth onClick={() => router.navigate({ to: '/painel/pedidos' })}>Ver Mesas</Button>

                    {/* Botão de Relatório Atualizado (Integração Caixa) */}
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleGenerateReport}
                        startIcon={generatingReport ? <CircularProgress size={16} /> : <Printer size={16} />}
                        disabled={loading || generatingReport}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {generatingReport ? 'Gerando...' : 'Relatório Parcial (Caixa)'}
                    </Button>
                </Box>
            </Paper>

            <StyledModal open={modalOpen === 'vendas'} onClose={() => setModalOpen(null)} title="Análise de Vendas">
                <VendasModalContent />
            </StyledModal>

            <StyledModal open={modalOpen === 'cancelados'} onClose={() => setModalOpen(null)} title="Histórico de Cancelamentos">
                <CanceladosModalContent />
            </StyledModal>
        </Box>
    );
}