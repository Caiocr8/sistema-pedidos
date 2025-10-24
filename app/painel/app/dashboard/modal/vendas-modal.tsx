'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    MenuItem,
    FormControl,
    Select,
    Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

// --- Constantes de Cor ---
const PAYMENT_COLORS = {
    pix: '#00C49F', // Verde
    cartao: '#0088FE', // Azul
    dinheiro: '#FFBB28', // Amarelo
    voucher: '#FF8042', // Laranja
};

// --- Helper de Formatação ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// --- MOCKS DE DADOS REESTRUTURADOS ---

// 1. DADOS ANUAIS (Para o Comparativo Anual)
const yearlySalesData = [
    {
        year: 2023,
        total: 216000.75,
        payments: {
            pix: 80000.75,
            cartao: 100000,
            dinheiro: 30000,
            voucher: 6000,
        },
    },
    {
        year: 2024,
        total: 280500.25,
        payments: {
            pix: 110000,
            cartao: 120500.25,
            dinheiro: 40000,
            voucher: 10000,
        },
    },
    {
        year: 2025,
        total: 62501.25, // Ano em progresso
        payments: {
            pix: 20000.75,
            cartao: 31000.5,
            dinheiro: 9000,
            voucher: 2500,
        },
    },
];

// 2. DADOS MENSAIS (Aninhados por Ano)
const monthlySalesData: {
    [year: number]: {
        month: string;
        total: number;
        payments: { pix: number; cartao: number; dinheiro: number; voucher: number };
    }[];
} = {
    2025: [
        {
            month: 'Ago',
            total: 18000.5,
            payments: { pix: 5000, cartao: 10000.5, dinheiro: 2000, voucher: 1000 },
        },
        {
            month: 'Set',
            total: 25000.75,
            payments: { pix: 8000.75, cartao: 12000, dinheiro: 4000, voucher: 1000 },
        },
        {
            month: 'Out',
            total: 19500.0,
            payments: { pix: 7000, cartao: 9000, dinheiro: 3000, voucher: 500 },
        },
    ],
    2024: [
        // ... (dados de 2024)
        {
            month: 'Jan',
            total: 22000.0,
            payments: { pix: 8000, cartao: 10000, dinheiro: 3000, voucher: 1000 },
        },
        {
            month: 'Fev',
            total: 20000.0,
            payments: { pix: 7000, cartao: 9000, dinheiro: 3000, voucher: 1000 },
        },
    ],
};

// 3. DADOS DIÁRIOS (Aninhados por Mês/Ano)
const dailySalesData: { [key: string]: { day: number; total: number }[] } = {
    'Ago/2025': Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        total: Math.random() * 500 + 400,
    })),
    'Set/2025': Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        total: Math.random() * 600 + 500,
    })),
    'Out/2025': Array.from({ length: 24 }, (_, i) => ({
        day: i + 1,
        total: Math.random() * 700 + 450,
    })),
    'Jan/2024': Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        total: Math.random() * 400 + 400,
    })),
    'Fev/2024': Array.from({ length: 29 }, (_, i) => ({
        day: i + 1,
        total: Math.random() * 300 + 400,
    })),
};

// --- Listas para os Filtros ---
const availableYears = [2025, 2024];
const availableMonths = [
    'Out/2025',
    'Set/2025',
    'Ago/2025',
    'Fev/2024',
    'Jan/2024',
];

// --- COMPONENTES DE GRÁFICO ---

const PaymentLegend = () => (
    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {Object.entries(PAYMENT_COLORS).map(([key, color]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                    sx={{
                        width: 14,
                        height: 14,
                        backgroundColor: color,
                        borderRadius: '4px',
                    }}
                />
                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {key}
                </Typography>
            </Box>
        ))}
    </Stack>
);

// --- Componente Gráfico: Barras Empilhadas (Mensal ou Anual) ---
const StackedBarChart = ({
    data,
    labelKey, // 'month' ou 'year'
}: {
    data: any[];
    labelKey: 'month' | 'year';
}) => {
    const maxTotal = Math.max(...data.map((d) => d.total));

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                height: '300px',
                width: '100%',
                justifyContent: 'space-around',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
            }}
        >
            {data.map((item) => {
                const barHeight = (item.total / maxTotal) * 100;
                const label = item[labelKey];

                return (
                    <Stack
                        key={label}
                        sx={{
                            flex: 1,
                            alignItems: 'center',
                            gap: 1,
                            height: '100%',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {formatCurrency(item.total)}
                        </Typography>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Stack>
                                    {Object.entries(item.payments).map(([key, value]) => (
                                        <Typography variant="caption" key={key}>
                                            {key}: {formatCurrency(value as number)}
                                        </Typography>
                                    ))}
                                </Stack>
                            }
                        >
                            <Box
                                sx={{
                                    width: '70%',
                                    height: `${barHeight}%`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'grey.200',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.03)' },
                                }}
                            >
                                {Object.entries(item.payments).map(([key, value]) => (
                                    <Box
                                        key={key}
                                        sx={{
                                            height: `${((value as number) / item.total) * 100}%`,
                                            backgroundColor:
                                                PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS],
                                        }}
                                    />
                                ))}
                            </Box>
                        </Tooltip>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {label}
                        </Typography>
                    </Stack>
                );
            })}
        </Box>
    );
};

// --- Componente Gráfico 2: Barras Diárias (Por Mês) ---
const DailyBarChart = ({
    data,
}: {
    data: { day: number; total: number }[];
}) => {
    if (!data || data.length === 0) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography>Sem dados para o período selecionado.</Typography>
            </Paper>
        );
    }
    const maxTotal = Math.max(...data.map((d) => d.total));

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                height: '300px',
                width: '100%',
                display: 'flex',
                gap: 0.5,
                alignItems: 'flex-end',
                overflowX: 'auto',
                backgroundColor: 'background.paper',
            }}
        >
            {data.map((item) => (
                <Tooltip
                    key={item.day}
                    arrow
                    placement="top"
                    title={`Dia ${item.day}: ${formatCurrency(item.total)}`}
                >
                    <Box
                        sx={{
                            width: '20px',
                            flexShrink: 0,
                            height: `${(item.total / maxTotal) * 100}%`,
                            backgroundColor: 'secondary.main',
                            borderRadius: 1,
                            '&:hover': { backgroundColor: 'secondary.dark' },
                        }}
                    />
                </Tooltip>
            ))}
        </Paper>
    );
};

/**
 * Conteúdo para o modal de Vendas, com filtros dinâmicos
 * para visualização Mensal, Diária e Anual.
 */
export default function VendasModalContent() {
    const [viewType, setViewType] = useState('monthly'); // 'monthly', 'daily', 'yearly'
    const [selectedYear, setSelectedYear] = useState(availableYears[0]); // Ex: 2025
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]); // Ex: 'Out/2025'

    const handleViewChange = (event: SelectChangeEvent) => {
        setViewType(event.target.value as string);
    };

    // --- Lógica de Renderização ---

    const renderTitle = () => {
        if (viewType === 'monthly') return `Total Vendido (Mensal - ${selectedYear})`;
        if (viewType === 'daily') return `Vendas Diárias (${selectedMonth})`;
        if (viewType === 'yearly') return 'Total Vendido (Anual)';
        return 'Análise de Vendas';
    };

    const renderChart = () => {
        switch (viewType) {
            case 'monthly':
                return (
                    <StackedBarChart
                        data={monthlySalesData[selectedYear] || []}
                        labelKey="month"
                    />
                );
            case 'daily':
                return <DailyBarChart data={dailySalesData[selectedMonth] || []} />;
            case 'yearly':
                return <StackedBarChart data={yearlySalesData} labelKey="year" />;
            default:
                return null;
        }
    };

    const showLegend = viewType === 'monthly' || viewType === 'yearly';

    return (
        <Stack spacing={3} sx={{ minWidth: { xs: '80vw', sm: '70vw', md: '50vw' } }}>
            {/* 1. Filtros */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth>
                    <Typography variant="caption" gutterBottom>
                        Tipo de Visão
                    </Typography>
                    <Select value={viewType} onChange={handleViewChange}>
                        <MenuItem value="monthly">Comparativo Mensal</MenuItem>
                        <MenuItem value="daily">Comparativo de Dias</MenuItem>
                        <MenuItem value="yearly">Comparativo Anual</MenuItem>
                    </Select>
                </FormControl>

                {/* Filtro de Ano (para visão Mensal) */}
                {viewType === 'monthly' && (
                    <FormControl size="small" fullWidth>
                        <Typography variant="caption" gutterBottom>
                            Selecione o Ano
                        </Typography>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value as number)}
                        >
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Filtro de Mês (para visão Diária) */}
                {viewType === 'daily' && (
                    <FormControl size="small" fullWidth>
                        <Typography variant="caption" gutterBottom>
                            Selecione o Mês
                        </Typography>
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value as string)}
                        >
                            {availableMonths.map((month) => (
                                <MenuItem key={month} value={month}>
                                    {month}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Stack>

            {/* 2. Legenda (Condicional) */}
            {showLegend && <PaymentLegend />}

            {/* 3. Gráfico (Condicional) */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    {renderTitle()}
                </Typography>
                {renderChart()}
            </Box>

            {/* 4. Resumo */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Resumo do Período
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>
                        (Aqui entraria um resumo de KPIs para o período selecionado:
                        Ticket Médio, Total de Pedidos, etc.)
                    </Typography>
                </Paper>
            </Box>
        </Stack>
    );
}

