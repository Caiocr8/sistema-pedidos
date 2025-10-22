// app/data/dashboard-mock.ts

export interface DashboardMetrics {
    totalVendas: number;
    totalPedidos: number;
    clientesAtivos: number;
    ticketMedio: number;
    crescimento: number;
}

export interface TopProduct {
    id: number;
    name: string;
    sales: number;
    revenue: number;
    percentage: number;
    trend: string;
}

export interface RecentOrder {
    id: string;
    customer: string;
    items: string;
    value: number;
    status: 'completed' | 'preparing' | 'pending';
    time: string;
}

// Dados fictícios de métricas
export const mockMetrics: DashboardMetrics = {
    totalVendas: 4850.50,
    totalPedidos: 127,
    clientesAtivos: 89,
    ticketMedio: 38.19,
    crescimento: 23.5,
};

// Top 5 produtos mais vendidos (dados fictícios)
export const topProducts: TopProduct[] = [
    { id: 1, name: 'Tapioca de Carne de Sol', sales: 156, revenue: 2340.00, percentage: 100, trend: '+12%' },
    { id: 2, name: 'Tapioca de Frango com Catupiry', sales: 134, revenue: 2010.00, percentage: 86, trend: '+8%' },
    { id: 3, name: 'Tapioca de Queijo Coalho', sales: 98, revenue: 1470.00, percentage: 63, trend: '+15%' },
    { id: 4, name: 'Tapioca Romeu e Julieta', sales: 87, revenue: 1305.00, percentage: 56, trend: '+5%' },
    { id: 5, name: 'Tapioca de Banana com Canela', sales: 76, revenue: 1140.00, percentage: 49, trend: '+3%' },
];

// Pedidos recentes (dados fictícios)
export const recentOrders: RecentOrder[] = [
    { id: '#1234', customer: 'João Silva', items: 'Tapioca de Carne de Sol + Suco', value: 32.00, status: 'completed', time: '5 min' },
    { id: '#1233', customer: 'Maria Santos', items: 'Tapioca de Frango', value: 28.00, status: 'preparing', time: '12 min' },
    { id: '#1232', customer: 'Pedro Costa', items: 'Tapioca Romeu e Julieta', value: 18.50, status: 'pending', time: '15 min' },
];