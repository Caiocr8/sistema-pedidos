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
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    Divider, // Importado
    LinearProgress, // Importado
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

// --- Helper de Geração de Dados ---
/** Gera dados diários ricos (total, pedidos, pagamentos) */
const generateDailyData = (
    days: number,
    minTotal: number,
    maxTotal: number
) => {
    return Array.from({ length: days }, (_, i) => {
        const total = Math.random() * (maxTotal - minTotal) + minTotal;
        const orders = Math.floor(Math.random() * 20 + 30); // 30-50 pedidos
        const pix = total * (Math.random() * 0.3 + 0.3); // 30-60%
        const cartao = total * (Math.random() * 0.2 + 0.2); // 20-40%
        const dinheiro = total * (Math.random() * 0.1 + 0.05); // 5-15%
        const voucher = Math.max(0, total - pix - cartao - dinheiro); // o resto

        return {
            day: i + 1,
            total,
            orders,
            payments: { pix, cartao, dinheiro, voucher },
        };
    });
};

// --- Mocks de Dados (MUITO MAIS DADOS) ---
const salesDataByYear: {
    [year: number]: {
        [month: string]: {
            total: number;
            payments: { [key: string]: number };
            daily: {
                day: number;
                total: number;
                orders: number;
                payments: { [key: string]: number };
            }[];
        };
    };
} = {
    2025: {
        Ago: {
            total: 18000.5,
            payments: { pix: 5000, cartao: 10000.5, dinheiro: 2000, voucher: 1000 },
            daily: generateDailyData(31, 400, 700),
        },
        Set: {
            total: 25000.75,
            payments: { pix: 8000.75, cartao: 12000, dinheiro: 4000, voucher: 1000 },
            daily: generateDailyData(30, 500, 800),
        },
        Out: {
            // Mês de Outubro (Out)
            total: 19500.0,
            payments: { pix: 7000, cartao: 9000, dinheiro: 3000, voucher: 500 },
            daily: [
                ...generateDailyData(23, 450, 750), // Dias 1-23
                {
                    // Dados específicos para 24/10/2025 (como no seu screenshot)
                    day: 24,
                    total: 1250.77,
                    orders: 58,
                    payments: { pix: 700, cartao: 400.27, dinheiro: 100.5, voucher: 50 },
                },
                ...generateDailyData(7, 450, 750).map((d, i) => ({ ...d, day: i + 25 })), // Dias 25-31
            ],
        },
    },
    2024: {
        // Dados de 2024 para investidores
        Jan: {
            total: 15000,
            payments: { pix: 6000, cartao: 7000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 300, 600),
        },
        Fev: {
            total: 14000,
            payments: { pix: 5000, cartao: 7000, dinheiro: 1000, voucher: 1000 },
            daily: generateDailyData(28, 350, 650),
        },
        Mar: {
            total: 17000,
            payments: { pix: 7000, cartao: 8000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 400, 700),
        },
        Abr: {
            total: 16500,
            payments: { pix: 6500, cartao: 7500, dinheiro: 2000, voucher: 500 },
            daily: generateDailyData(30, 400, 650),
        },
        Mai: {
            total: 18000,
            payments: { pix: 8000, cartao: 8000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 450, 700),
        },
        Jun: {
            total: 19000,
            payments: { pix: 9000, cartao: 8500, dinheiro: 1000, voucher: 500 },
            daily: generateDailyData(30, 500, 750),
        },
        Jul: {
            total: 20000,
            payments: { pix: 10000, cartao: 8000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 500, 800),
        },
        Ago: {
            total: 21000,
            payments: { pix: 10000, cartao: 9000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 550, 800),
        },
        Set: {
            total: 22000,
            payments: { pix: 11000, cartao: 9000, dinheiro: 1000, voucher: 1000 },
            daily: generateDailyData(30, 550, 850),
        },
        Out: {
            total: 23000,
            payments: { pix: 12000, cartao: 9000, dinheiro: 1500, voucher: 500 },
            daily: generateDailyData(31, 600, 850),
        },
        Nov: {
            total: 24000,
            payments: { pix: 12000, cartao: 10000, dinheiro: 1000, voucher: 1000 },
            daily: generateDailyData(30, 600, 900),
        },
        Dez: {
            total: 30000,
            payments: { pix: 15000, cartao: 12000, dinheiro: 2000, voucher: 1000 },
            daily: generateDailyData(31, 700, 1000),
        },
    },
};

const monthMap: { [key: string]: number } = {
    Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5, Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

// --- Componente de Legenda ---
const PaymentLegend = () => (
    // ... (código da legenda permanece o mesmo)
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

// --- Componente Gráfico: Barras Empilhadas (Mensal / Anual) ---
const StackedBarChart = ({
    // ... (código do gráfico empilhado permanece o mesmo)
    data,
    labelKey,
}: {
    data: {
        label: string;
        total: number;
        payments: { [key: string]: number };
    }[];
    labelKey: string;
}) => {
    const maxTotal = Math.max(...data.map((d) => d.total));

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                height: '300px',
                width: '100%',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflowX: 'auto',
                justifyContent: 'flex-start',
            }}
        >
            {data.map((item) => {
                const barHeight = (item.total / maxTotal) * 100;

                return (
                    <Stack
                        key={item.label}
                        sx={{
                            alignItems: 'center',
                            gap: 1,
                            height: '100%',
                            justifyContent: 'flex-end',
                            minWidth: '80px',
                            flexShrink: 0,
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
                                        <Typography
                                            key={key}
                                            variant="caption"
                                            sx={{ textTransform: 'capitalize' }}
                                        >
                                            {key}: {formatCurrency(value)}
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
                                {/* Barras empilhadas */}
                                {Object.entries(item.payments).map(([key, value]) => (
                                    <Box
                                        key={key}
                                        sx={{
                                            height: `${(value / item.total) * 100}%`,
                                            backgroundColor:
                                                PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS],
                                        }}
                                    />
                                ))}
                            </Box>
                        </Tooltip>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.label}
                        </Typography>
                    </Stack>
                );
            })}
        </Box>
    );
};

// --- Componente Gráfico: Barras Diárias (Por Mês) ---
const DailyBarChart = ({
    // ... (código do gráfico diário permanece o mesmo)
    data,
}: {
    data: { day: number; total: number; orders: number; payments: any }[];
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
                <Typography variant="body2">
                    Não há dados diários para o mês selecionado.
                </Typography>
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

// --- NOVO Componente KPI: Resumo do Dia ou Período ---
const DailyPeriodSummary = ({
    data,
    title,
}: {
    data: {
        total: number;
        orders: number;
        payments: { [key: string]: number };
    };
    title: string;
}) => {
    const ticketMedio = data.orders > 0 ? data.total / data.orders : 0;
    const totalPayments =
        Object.values(data.payments).reduce((a, b) => a + b, 0) || 1; // Evita divisão por zero

    return (
        <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
                {/* KPIs Principais */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 2, sm: 4 }}
                    justifyContent="space-around"
                    textAlign={{ xs: 'left', sm: 'center' }}
                >
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Vendido
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {formatCurrency(data.total)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total de Pedidos
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {data.orders}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Ticket Médio
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {formatCurrency(ticketMedio)}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Detalhes de Pagamento */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Vendas por Pagamento
                </Typography>
                <Stack spacing={1.5}>
                    {Object.entries(data.payments).map(([key, value]) => (
                        <Box key={key}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                sx={{ mb: 0.5 }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ textTransform: 'capitalize' }}
                                >
                                    {key}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(value)} (
                                    {((value / totalPayments) * 100).toFixed(0)}%)
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={(value / totalPayments) * 100}
                                color={
                                    PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS]
                                        ? undefined
                                        : 'primary'
                                }
                                sx={{
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: 'divider',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor:
                                            PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS],
                                    },
                                }}
                            />
                        </Box>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
};

// --- Componente Principal do Conteúdo do Modal ---
export default function VendasModalContent() {
    const [tipoVisao, setTipoVisao] = useState('Mensal');
    const [anoSelecionado, setAnoSelecionado] = useState(2025);
    const [mesSelecionado, setMesSelecionado] = useState('Out');

    // --- ESTADOS PARA FILTRO DIÁRIO ---
    const [subFiltroDia, setSubFiltroDia] = useState('mesInteiro');
    const [diaUnico, setDiaUnico] = useState('2025-10-24'); // Padrão para o dia com dados
    const [diaInicio, setDiaInicio] = useState('');
    const [diaFim, setDiaFim] = useState('');

    // --- Lógica de Handlers ---
    const handleTipoVisaoChange = (event: SelectChangeEvent) => {
        setTipoVisao(event.target.value as string);
    };
    const handleAnoChange = (event: SelectChangeEvent<number>) => {
        setAnoSelecionado(event.target.value as number);
        // Reseta o mês se o ano mudar para evitar mês inválido
        if (event.target.value !== anoSelecionado) {
            setMesSelecionado('Out'); // Ou o primeiro mês disponível
        }
    };
    const handleMesChange = (event: SelectChangeEvent) => {
        setMesSelecionado(event.target.value as string);
    };
    const handleSubFiltroDiaChange = (
        event: React.MouseEvent<HTMLElement>,
        newSubFiltro: string | null
    ) => {
        if (newSubFiltro !== null) {
            setSubFiltroDia(newSubFiltro);
        }
    };

    // --- Preparação de Dados para Gráficos ---
    const dataAno = salesDataByYear[anoSelecionado] || {};

    const monthlyData = Object.keys(dataAno).map((monthKey) => ({
        label: monthKey,
        total: dataAno[monthKey].total,
        payments: dataAno[monthKey].payments,
    }));

    const yearlyData = Object.keys(salesDataByYear).map((yearKey) => {
        const year = Number(yearKey);
        const months = salesDataByYear[year];
        if (!months) return { label: yearKey, total: 0, payments: {} }; // Proteção

        const total = Object.values(months).reduce((acc, m) => acc + m.total, 0);
        const payments = Object.values(months).reduce(
            (acc, m) => {
                acc.pix += m.payments.pix || 0;
                acc.cartao += m.payments.cartao || 0;
                acc.dinheiro += m.payments.dinheiro || 0;
                acc.voucher += m.payments.voucher || 0;
                return acc;
            },
            { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 }
        );
        return { label: yearKey, total, payments };
    });

    const dailyData = (dataAno[mesSelecionado] || {}).daily || [];

    // --- LÓGICA ATUALIZADA para Dia Específico e Período ---

    // Lógica para Dia Específico
    let diaUnicoData: any = null;
    let diaUnicoTitle = '';
    if (subFiltroDia === 'diaUnico' && diaUnico) {
        try {
            // Adiciona T00:00:00 para evitar problemas de fuso horário
            const dateObj = new Date(diaUnico + 'T00:00:00');
            const year = dateObj.getFullYear();
            const monthNum = dateObj.getMonth() + 1; // 0-11 -> 1-12
            const day = dateObj.getDate(); // 1-31

            // Converte YYYY-MM-DD para o nome do mês (ex: 'Out')
            const monthName =
                dateObj.toLocaleString('pt-BR', { month: 'short' }).charAt(0).toUpperCase() +
                dateObj.toLocaleString('pt-BR', { month: 'short' }).slice(1).replace('.', '');

            const yearData = salesDataByYear[year];
            if (yearData && yearData[monthName]) {
                const dayData = yearData[monthName].daily.find((d) => d.day === day);
                if (dayData) {
                    diaUnicoData = {
                        total: dayData.total,
                        orders: dayData.orders,
                        payments: dayData.payments,
                    };
                    diaUnicoTitle = `Resumo do Dia: ${day}/${monthNum}/${year}`;
                }
            }
        } catch (e) {
            console.error('Erro ao parsear data: ', e);
        }
    }

    // Lógica para Período (Agregação)
    let periodoData: any = null;
    let periodoTitle = '';
    if (subFiltroDia === 'periodo' && diaInicio && diaFim) {
        try {
            const startDate = new Date(diaInicio + 'T00:00:00');
            const endDate = new Date(diaFim + 'T00:00:00');

            let total = 0;
            let orders = 0;
            const payments = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };

            Object.keys(salesDataByYear).forEach((yearKey) => {
                const year = Number(yearKey);
                const yearData = salesDataByYear[year];
                if (!yearData) return;

                Object.keys(yearData).forEach((monthName) => {
                    const monthIndex = monthMap[monthName];
                    if (monthIndex === undefined) return;

                    yearData[monthName].daily.forEach((dayData) => {
                        const currentDate = new Date(year, monthIndex, dayData.day);

                        if (currentDate >= startDate && currentDate <= endDate) {
                            total += dayData.total;
                            orders += dayData.orders;
                            payments.pix += dayData.payments.pix || 0;
                            payments.cartao += dayData.payments.cartao || 0;
                            payments.dinheiro += dayData.payments.dinheiro || 0;
                            payments.voucher += dayData.payments.voucher || 0;
                        }
                    });
                });
            });

            periodoData = { total, orders, payments };
            periodoTitle = `Resumo do Período: ${startDate.toLocaleDateString(
                'pt-BR'
            )} - ${endDate.toLocaleDateString('pt-BR')}`;
        } catch (e) {
            console.error('Erro ao agregar período: ', e);
        }
    }

    return (
        <Stack spacing={3} sx={{ minWidth: { xs: '80vw', sm: '70vw', md: '50vw' } }}>
            {/* --- 1. FILTROS --- */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
            >
                <FormControl size="small" fullWidth>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Tipo de Visão
                    </Typography>
                    <Select value={tipoVisao} onChange={handleTipoVisaoChange}>
                        <MenuItem value="Mensal">Comparativo Mensal</MenuItem>
                        <MenuItem value="Diário">Comparativo de Dias</MenuItem>
                        <MenuItem value="Anual">Comparativo Anual</MenuItem>
                    </Select>
                </FormControl>

                {/* Filtro de Ano (Aparece para Mensal) */}
                {tipoVisao === 'Mensal' && (
                    <FormControl size="small" fullWidth>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Selecione o Ano
                        </Typography>
                        <Select value={anoSelecionado} onChange={handleAnoChange}>
                            {Object.keys(salesDataByYear).map((year) => (
                                <MenuItem key={year} value={Number(year)}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Filtro de Mês (Aparece para Diário) */}
                {tipoVisao === 'Diário' && (
                    <FormControl size="small" fullWidth>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Selecione o Mês
                        </Typography>
                        <Select value={mesSelecionado} onChange={handleMesChange}>
                            {Object.keys(dataAno).map((month) => (
                                <MenuItem key={month} value={month}>
                                    {month}/{anoSelecionado}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Stack>

            {/* --- 2. FILTROS DE DIA (Condicional) --- */}
            {tipoVisao === 'Diário' && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Filtrar dias por:
                    </Typography>
                    <ToggleButtonGroup
                        value={subFiltroDia}
                        exclusive
                        onChange={handleSubFiltroDiaChange}
                        size="small"
                        color="primary"
                        fullWidth
                        sx={{ mb: 1 }}
                    >
                        <ToggleButton value="mesInteiro">Mês Inteiro</ToggleButton>
                        <ToggleButton value="diaUnico">Dia Específico</ToggleButton>
                        <ToggleButton value="periodo">Período</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Input para Dia Específico */}
                    {subFiltroDia === 'diaUnico' && (
                        <TextField
                            label="Selecione o Dia"
                            type="date"
                            value={diaUnico}
                            onChange={(e) => setDiaUnico(e.target.value)}
                            sx={{ mt: 2, width: '100%' }}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}

                    {/* Inputs para Período */}
                    {subFiltroDia === 'periodo' && (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ mt: 2 }}
                        >
                            <TextField
                                label="Data Início"
                                type="date"
                                value={diaInicio}
                                onChange={(e) => setDiaInicio(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                            <TextField
                                label="Data Fim"
                                type="date"
                                value={diaFim}
                                onChange={(e) => setDiaFim(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Stack>
                    )}
                </Paper>
            )}

            {/* --- 3. LEGENDA (Aparece para Mensal e Anual) --- */}
            {(tipoVisao === 'Mensal' || tipoVisao === 'Anual') && <PaymentLegend />}

            {/* --- 4. TÍTULO DO GRÁFICO --- */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    {tipoVisao === 'Mensal' && `Total Vendido (${anoSelecionado})`}
                    {tipoVisao === 'Anual' && 'Total Vendido (Anual)'}
                    {tipoVisao === 'Diário' &&
                        subFiltroDia === 'mesInteiro' &&
                        `Vendas Diárias (${mesSelecionado})`}
                </Typography>

                {/* --- 5. GRÁFICO CONDICIONAL --- */}

                {/* Gráfico Anual */}
                {tipoVisao === 'Anual' && (
                    <StackedBarChart data={yearlyData} labelKey="year" />
                )}

                {/* Gráfico Mensal */}
                {tipoVisao === 'Mensal' && (
                    <StackedBarChart data={monthlyData} labelKey="month" />
                )}

                {/* Gráfico Diário (Mês Inteiro) */}
                {tipoVisao === 'Diário' && subFiltroDia === 'mesInteiro' && (
                    <DailyBarChart data={dailyData} />
                )}

                {/* KPI de Dia Único (Substitui o placeholder) */}
                {tipoVisao === 'Diário' && subFiltroDia === 'diaUnico' && (
                    diaUnicoData ? (
                        <DailyPeriodSummary data={diaUnicoData} title={diaUnicoTitle} />
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body1">
                                {diaUnico
                                    ? 'Nenhum dado encontrado para este dia.'
                                    : 'Selecione um dia para ver o resumo.'}
                            </Typography>
                        </Paper>
                    )
                )}
                {tipoVisao === 'Diário' && subFiltroDia === 'periodo' && (
                    periodoData ? (
                        <DailyPeriodSummary data={periodoData} title={periodoTitle} />
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body1">
                                {diaInicio && diaFim
                                    ? 'Nenhum dado encontrado para este período.'
                                    : 'Selecione um período para ver o resumo.'}
                            </Typography>
                        </Paper>
                    )
                )}
            </Box>
        </Stack>
    );
}

