'use client';

// Importado 'useState' para controlar os modais
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { TrendingUp, ShoppingBag, DollarSign, CircleX, Clock, Star } from 'lucide-react';
import Button from '@/app/components/ui/button';
import MetricCard from '@/app/components/layout/dashboard/metric-card';
import ProductItem from '@/app/components/layout/dashboard/product-item';
import OrderCard from '@/app/components/layout/dashboard/order-card';
import { mockMetrics, topProducts, recentOrders } from '@/app/components/layout/dashboard/data/dashboard-mock';

// Importa o modal estilizado e os novos conteúdos
import StyledModal from '@/app/components/ui/modal';
import VendasModalContent from './modal/vendas-modal';
import CanceladosModalContent from './modal/cancelados-modal';


export default function DashboardPage() {
    const router = useRouter();

    // Estado para controlar qual modal está aberto
    // 'vendas', 'cancelados', ou null (nenhum)
    const [modalOpen, setModalOpen] = useState<'vendas' | 'cancelados' | null>(null);

    return (
        <Box sx={{ width: '100%' }}>
            {/* Cards de Métricas */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr',
                        md: 'repeat(3, 1fr)',
                    },
                    gap: 3,
                    mb: 4,
                }}
            >
                {/* --- CARD DE VENDAS (COM ONCLICK) --- */}
                <Box onClick={() => setModalOpen('vendas')} sx={{ cursor: 'pointer' }}>
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
                </Box>

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

                {/* --- CARD DE CANCELADOS (COM ONCLICK) --- */}
                <Box onClick={() => setModalOpen('cancelados')} sx={{ cursor: 'pointer' }}>
                    <MetricCard
                        title="Pedidos Cancelados"
                        value={mockMetrics.pedidosCancelados}
                        badge="+4 novos"
                        icon={CircleX}
                        iconColor="red"
                        bgColor="error.light"
                        valueColor="error.dark"
                        badgeColor="error"
                    />
                </Box>

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

            {/* --- MODAIS RENDERIZADOS AQUI --- */}

            {/* Modal de Vendas */}
            <StyledModal
                open={modalOpen === 'vendas'}
                onClose={() => setModalOpen(null)}
                title="Análise de Vendas"
            >
                <VendasModalContent />
            </StyledModal>

            {/* Modal de Pedidos Cancelados */}
            <StyledModal
                open={modalOpen === 'cancelados'}
                onClose={() => setModalOpen(null)}
                title="Detalhes dos Pedidos Cancelados"
            >
                <CanceladosModalContent />
            </StyledModal>

        </Box>
    );
}
