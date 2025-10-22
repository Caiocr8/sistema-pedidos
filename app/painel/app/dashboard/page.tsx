// app/painel/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { TrendingUp, ShoppingBag, DollarSign, Users, Clock, Star } from 'lucide-react';
import Button from '@/app/components/ui/button';
import MetricCard from '@/app/components/layout/dashboard/metric-card';
import ProductItem from '@/app/components/layout/dashboard/product-item';
import OrderCard from '@/app/components/layout/dashboard/order-card';
import { mockMetrics, topProducts, recentOrders } from '@/app/components/layout/dashboard/data/dashboard-mock';

export default function DashboardPage() {
    const router = useRouter();

    return (
        <Box sx={{ width: '100%' }}>
            {/* Cards de Métricas */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                    },
                    gap: 3,
                    mb: 4,
                }}
            >
                <MetricCard
                    title="Vendas Hoje"
                    value={`R$ ${mockMetrics.totalVendas.toFixed(2)}`}
                    badge={`+${mockMetrics.crescimento}%`}
                    icon={DollarSign}
                    iconColor="green"
                    bgColor="success.light"
                    valueColor="success.main"
                    badgeColor="success"
                />

                <MetricCard
                    title="Pedidos Hoje"
                    value={mockMetrics.totalPedidos}
                    badge="+18 novo"
                    icon={ShoppingBag}
                    iconColor="#C68642"
                    bgColor="primary.light"
                    valueColor="primary.main"
                    badgeColor="primary"
                />

                <MetricCard
                    title="Clientes Ativos"
                    value={mockMetrics.clientesAtivos}
                    badge="+7 novos"
                    icon={Users}
                    iconColor="#0288D1"
                    bgColor="info.light"
                    valueColor="info.main"
                    badgeColor="info"
                />

                <MetricCard
                    title="Ticket Médio"
                    value={`R$ ${mockMetrics.ticketMedio.toFixed(2)}`}
                    badge="+R$ 3,20"
                    icon={TrendingUp}
                    iconColor="#C68642"
                    bgColor="warning.light"
                    valueColor="warning.main"
                    badgeColor="warning"
                />
            </Box>

            {/* Top Produtos e Pedidos Recentes */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: '7fr 5fr',
                    },
                    gap: 3,
                    mb: 3,
                }}
            >
                {/* Top Produtos */}
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Star size={24} color="#C68642" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Top 5 Produtos Mais Vendidos
                        </Typography>
                    </Box>

                    <Stack spacing={2.5}>
                        {topProducts.map((product, index) => (
                            <ProductItem
                                key={product.id}
                                rank={index + 1}
                                name={product.name}
                                sales={product.sales}
                                revenue={product.revenue}
                                percentage={product.percentage}
                                trend={product.trend}
                            />
                        ))}
                    </Stack>
                </Paper>

                {/* Pedidos Recentes */}
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Clock size={24} color="#C68642" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Pedidos Recentes
                        </Typography>
                    </Box>

                    <Stack spacing={2}>
                        {recentOrders.map((order) => (
                            <OrderCard key={order.id} {...order} />
                        ))}
                    </Stack>

                    <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => router.push('/painel/pedidos')}
                    >
                        Ver Todos os Pedidos
                    </Button>
                </Paper>
            </Box>

            {/* Ações Rápidas */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Ações Rápidas
                </Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => router.push('/painel/pedidos/novo')}
                    >
                        Novo Pedido
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => router.push('/painel/cardapio')}
                    >
                        Gerenciar Cardápio
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => router.push('/painel/clientes')}
                    >
                        Ver Clientes
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => router.push('/painel/relatorios')}
                    >
                        Relatórios
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
