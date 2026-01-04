import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Box, Paper, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import { TrendingUp, ShoppingBag, DollarSign, CircleX, Clock, Star } from 'lucide-react';

// Firebase
import { db } from '@/lib/api/firebase/config';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, Firestore } from 'firebase/firestore';

// Componentes
import Button from '@/components/ui/button';
import MetricCard from '@/components/layout/dashboard/metric-card';
import ProductItem from '@/components/layout/dashboard/product-item';
import OrderCard, { OrderCardProps, OrderStatus } from '@/components/layout/dashboard/order-card';
import { mockMetrics, topProducts } from '@/components/layout/dashboard/data/dashboard-mock';

// Modais (Ajuste o caminho se necessário)
import StyledModal from '@/components/ui/modal';
import VendasModalContent from '@/components/dashboard/modal/vendas-modal';
import CanceladosModalContent from '@/components/dashboard/modal/cancelados-modal';

interface FirebaseOrderData {
    clienteNome: string;
    total: number;
    status: OrderStatus;
    createdAt: Timestamp;
    itens: { nome: string; quantidade: number; }[];
}

function formatTimeAgo(timestamp: Timestamp | undefined | null): string {
    if (!timestamp) return 'agora';
    try {
        const diffMs = new Date().getTime() - timestamp.toDate().getTime();
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < 1) return 'agora';
        if (diffMin < 60) return `${diffMin}m atrás`;
        const diffHr = Math.round(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h atrás`;
        return `${Math.round(diffHr / 24)}d atrás`;
    } catch { return "data inválida"; }
}

export const Route = createFileRoute('/_auth/painel/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState<'vendas' | 'cancelados' | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderCardProps[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    useEffect(() => {
        setLoadingOrders(true);
        const pedidosRef = collection(db as Firestore, 'pedidos');
        const q = query(pedidosRef, orderBy('createdAt', 'desc'), limit(4));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => {
                const data = doc.data() as FirebaseOrderData;
                const itemsString = data.itens?.slice(0, 2).map(i => `${i.quantidade}x ${i.nome}`).join(', ') + (data.itens?.length > 2 ? ', ...' : '') || "Sem itens";

                return {
                    id: doc.id,
                    customer: data.clienteNome,
                    value: data.total,
                    time: formatTimeAgo(data.createdAt),
                    status: data.status,
                    items: itemsString,
                };
            });
            setRecentOrders(ordersData);
            setLoadingOrders(false);
        }, (err) => {
            console.error(err);
            setOrdersError("Erro ao carregar pedidos.");
            setLoadingOrders(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                <Box onClick={() => setModalOpen('vendas')} sx={{ cursor: 'pointer' }}>
                    <MetricCard title="Vendas Hoje" value={`R$ ${mockMetrics.totalVendas.toFixed(2)}`} badge={`+${mockMetrics.crescimento}%`} icon={DollarSign} iconColor="green" bgColor="success.light" valueColor="success.main" />
                </Box>
                <MetricCard title="Pedidos Hoje" value={mockMetrics.totalPedidos} badge="+18 novo" icon={ShoppingBag} iconColor="#C68642" bgColor="primary.light" valueColor="primary.main" badgeColor="primary" />
                <Box onClick={() => setModalOpen('cancelados')} sx={{ cursor: 'pointer' }}>
                    <MetricCard title="Cancelados" value={mockMetrics.pedidosCancelados} badge="+4 novos" icon={CircleX} iconColor="red" bgColor="error.light" valueColor="error.dark" badgeColor="error" />
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, mb: 3 }}>
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Star size={24} color="#C68642" />
                        <Typography variant="h6" fontWeight={600}>Top Produtos</Typography>
                    </Box>
                    <Stack spacing={2.5}>
                        {topProducts.map((p, i) => <ProductItem key={p.id} rank={i + 1} {...p} />)}
                    </Stack>
                </Paper>

                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Clock size={24} color="#C68642" />
                        <Typography variant="h6" fontWeight={600}>Pedidos Recentes</Typography>
                    </Box>

                    {loadingOrders ? <CircularProgress /> : ordersError ? <Alert severity="error">{ordersError}</Alert> :
                        <Stack spacing={2}>
                            {recentOrders.map(order => <OrderCard key={order.id} {...order} />)}
                        </Stack>
                    }

                    <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => router.navigate({ to: '/painel/pedidos' })}>
                        Ver Todos os Pedidos
                    </Button>
                </Paper>
            </Box>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>Ações Rápidas</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Button variant="contained" fullWidth onClick={() => router.navigate({ to: '/painel/novo-pedido' })}>Novo Pedido</Button>
                    <Button variant="outlined" fullWidth onClick={() => router.navigate({ to: '/painel/cardapio' })}>Cardápio</Button>
                    <Button variant="outlined" fullWidth disabled>Clientes</Button>
                    <Button variant="outlined" fullWidth disabled>Relatórios</Button>
                </Box>
            </Paper>

            <StyledModal open={modalOpen === 'vendas'} onClose={() => setModalOpen(null)} title="Análise de Vendas"><VendasModalContent /></StyledModal>
            <StyledModal open={modalOpen === 'cancelados'} onClose={() => setModalOpen(null)} title="Pedidos Cancelados"><CanceladosModalContent /></StyledModal>
        </Box>
    );
}