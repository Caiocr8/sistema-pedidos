'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stack, MenuItem, FormControl, Select, Tooltip,
    ToggleButtonGroup, ToggleButton, TextField, Divider, LinearProgress, CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { db } from '@/lib/api/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

// --- Interfaces (Movidas para o topo para uso global) ---
interface DailyData {
    day: number;
    total: number;
    orders: number;
    payments: { [key: string]: number }
}

interface MonthData {
    total: number;
    payments: { [key: string]: number };
    daily: DailyData[]
}

interface YearData {
    [month: string]: MonthData
}

interface SalesDataStructure {
    [year: number]: YearData
}

// --- Constantes e Helpers ---
const PAYMENT_COLORS = {
    pix: '#00C49F',
    cartao: '#0088FE',
    dinheiro: '#FFBB28',
    voucher: '#FF8042',
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const monthMap: { [key: string]: number } = {
    Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5, Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};
const monthNames = Object.keys(monthMap);

const PaymentLegend = () => (
    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {Object.entries(PAYMENT_COLORS).map(([key, color]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 14, height: 14, backgroundColor: color, borderRadius: '4px' }} />
                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
            </Box>
        ))}
    </Stack>
);

// --- Componente Gráfico: Barras Empilhadas ---
// CORREÇÃO: Removido labelKey pois não é usado (os dados já possuem a prop 'label')
const StackedBarChart = ({
    data
}: {
    data: { label: string; total: number; payments: { [key: string]: number } }[];
}) => {
    const maxTotal = Math.max(...data.map((d) => d.total)) || 1;
    return (
        <Box sx={{ display: 'flex', gap: 2, height: '300px', width: '100%', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto', justifyContent: 'flex-start' }}>
            {data.map((item) => {
                const barHeight = (item.total / maxTotal) * 100;
                return (
                    <Stack key={item.label} sx={{ alignItems: 'center', gap: 1, height: '100%', justifyContent: 'flex-end', minWidth: '80px', flexShrink: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(item.total)}</Typography>
                        <Tooltip arrow placement="top" title={<Stack>{Object.entries(item.payments).map(([key, value]) => (<Typography key={key} variant="caption" sx={{ textTransform: 'capitalize' }}>{key}: {formatCurrency(value)}</Typography>))}</Stack>}>
                            <Box sx={{ width: '70%', height: `${Math.max(barHeight, 1)}%`, display: 'flex', flexDirection: 'column', backgroundColor: 'grey.200', borderRadius: 1, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)' } }}>
                                {Object.entries(item.payments).map(([key, value]) => (<Box key={key} sx={{ height: `${(value / item.total) * 100}%`, backgroundColor: PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS] }} />))}
                            </Box>
                        </Tooltip>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                    </Stack>
                );
            })}
        </Box>
    );
};

// --- Componente Gráfico: Barras Diárias ---
const DailyBarChart = ({ data }: { data: { day: number; total: number; orders: number; payments: any }[] }) => {
    if (!data || data.length === 0) return <Paper variant="outlined" sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="body2" color="text.secondary">Não há dados diários.</Typography></Paper>;
    const maxTotal = Math.max(...data.map((d) => d.total)) || 1;
    return (
        <Paper variant="outlined" sx={{ p: 2, height: '300px', width: '100%', display: 'flex', gap: 0.5, alignItems: 'flex-end', overflowX: 'auto', backgroundColor: 'background.paper' }}>
            {data.map((item) => (
                <Tooltip key={item.day} arrow placement="top" title={`Dia ${item.day}: ${formatCurrency(item.total)} (${item.orders} pedidos)`}>
                    <Box sx={{ width: '20px', flexShrink: 0, height: `${(item.total / maxTotal) * 100}%`, backgroundColor: 'secondary.main', borderRadius: 1, '&:hover': { backgroundColor: 'secondary.dark' } }} />
                </Tooltip>
            ))}
        </Paper>
    );
};

// --- Componente KPI ---
const DailyPeriodSummary = ({ data, title }: { data: { total: number; orders: number; payments: { [key: string]: number } }; title: string }) => {
    const ticketMedio = data.orders > 0 ? data.total / data.orders : 0;
    const totalPayments = Object.values(data.payments).reduce((a, b) => a + b, 0) || 1;
    return (
        <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }} justifyContent="space-around" textAlign={{ xs: 'left', sm: 'center' }}>
                    <Box><Typography variant="body2" color="text.secondary">Total Vendido</Typography><Typography variant="h5" sx={{ fontWeight: 600 }}>{formatCurrency(data.total)}</Typography></Box>
                    <Box><Typography variant="body2" color="text.secondary">Total de Pedidos</Typography><Typography variant="h5" sx={{ fontWeight: 600 }}>{data.orders}</Typography></Box>
                    <Box><Typography variant="body2" color="text.secondary">Ticket Médio</Typography><Typography variant="h5" sx={{ fontWeight: 600 }}>{formatCurrency(ticketMedio)}</Typography></Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Vendas por Pagamento</Typography>
                <Stack spacing={1.5}>
                    {Object.entries(data.payments).map(([key, value]) => (
                        <Box key={key}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(value)} ({((value / totalPayments) * 100).toFixed(0)}%)</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={(value / totalPayments) * 100} sx={{ height: 8, borderRadius: 2, backgroundColor: 'divider', '& .MuiLinearProgress-bar': { backgroundColor: PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS] } }} />
                        </Box>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
};

export default function VendasModalContent() {
    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState<SalesDataStructure>({});
    const [tipoVisao, setTipoVisao] = useState('Mensal');
    const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
    const currentMonthIndex = new Date().getMonth();
    const [mesSelecionado, setMesSelecionado] = useState(monthNames[currentMonthIndex]);
    const [subFiltroDia, setSubFiltroDia] = useState('mesInteiro');
    const [diaUnico, setDiaUnico] = useState(new Date().toISOString().split('T')[0]);
    const [diaInicio, setDiaInicio] = useState('');
    const [diaFim, setDiaFim] = useState('');

    useEffect(() => {
        const fetchAndProcessData = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'pedidos'), where('status', '==', 'entregue'));
                const snapshot = await getDocs(q);
                const structure: SalesDataStructure = {};

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const timestamp = data.pagamento?.data || data.createdAt;
                    if (!timestamp) return;

                    const date = timestamp.toDate();
                    const year = date.getFullYear();
                    const monthName = monthNames[date.getMonth()];
                    const day = date.getDate();
                    const total = data.total || 0;

                    const pags = data.pagamento?.pagamentos || {};
                    const methodAmounts = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };

                    if (Object.keys(pags).length > 0) {
                        Object.entries(pags).forEach(([metodo, valor]) => {
                            const mLower = metodo.toLowerCase();
                            const val = Number(valor);
                            if (mLower.includes('pix')) methodAmounts.pix += val;
                            else if (mLower.includes('dinheiro')) methodAmounts.dinheiro += val;
                            else if (mLower.includes('crédito') || mLower.includes('debito') || mLower.includes('cartão')) methodAmounts.cartao += val;
                            else if (mLower.includes('vale') || mLower.includes('voucher')) methodAmounts.voucher += val;
                            else methodAmounts.cartao += val;
                        });
                    } else {
                        methodAmounts.cartao = total;
                    }

                    if (!structure[year]) structure[year] = {};
                    if (!structure[year][monthName]) structure[year][monthName] = { total: 0, payments: { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 }, daily: [] };

                    const monthData = structure[year][monthName];
                    monthData.total += total;
                    monthData.payments.pix += methodAmounts.pix;
                    monthData.payments.cartao += methodAmounts.cartao;
                    monthData.payments.dinheiro += methodAmounts.dinheiro;
                    monthData.payments.voucher += methodAmounts.voucher;

                    let dayData = monthData.daily.find(d => d.day === day);
                    if (!dayData) {
                        dayData = { day, total: 0, orders: 0, payments: { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 } };
                        monthData.daily.push(dayData);
                    }
                    dayData.total += total;
                    dayData.orders += 1;
                    dayData.payments.pix += methodAmounts.pix;
                    dayData.payments.cartao += methodAmounts.cartao;
                    dayData.payments.dinheiro += methodAmounts.dinheiro;
                    dayData.payments.voucher += methodAmounts.voucher;
                });

                Object.values(structure).forEach((year: YearData) => {
                    Object.values(year).forEach((month: MonthData) => {
                        month.daily.sort((a, b) => a.day - b.day);
                    });
                });

                setSalesData(structure);
                const availableYears = Object.keys(structure).map(Number).sort((a, b) => b - a);
                if (availableYears.length > 0 && !structure[anoSelecionado]) setAnoSelecionado(availableYears[0]);

            } catch (error) { console.error("Erro:", error); } finally { setLoading(false); }
        };
        fetchAndProcessData();
    }, []);

    const handleTipoVisaoChange = (event: SelectChangeEvent) => setTipoVisao(event.target.value);
    const handleAnoChange = (event: SelectChangeEvent<number>) => { setAnoSelecionado(event.target.value as number); const dataAno = salesData[event.target.value as number]; if (dataAno && !dataAno[mesSelecionado]) setMesSelecionado(Object.keys(dataAno)[0] || 'Jan'); };
    const handleMesChange = (event: SelectChangeEvent) => setMesSelecionado(event.target.value);
    const handleSubFiltroDiaChange = (e: any, newVal: string | null) => { if (newVal) setSubFiltroDia(newVal); };

    const dataAno = salesData[anoSelecionado] || {};
    const monthlyData = monthNames.map(m => ({ label: m, total: dataAno[m]?.total || 0, payments: dataAno[m]?.payments || { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 } })).filter(d => d.total > 0);
    const yearlyData = Object.keys(salesData).map(yKey => {
        const yData = salesData[Number(yKey)];
        let total = 0;
        const payments = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };
        Object.values(yData).forEach(m => { total += m.total; payments.pix += m.payments.pix; payments.cartao += m.payments.cartao; payments.dinheiro += m.payments.dinheiro; payments.voucher += m.payments.voucher; });
        return { label: yKey, total, payments };
    });
    const dailyData = (dataAno[mesSelecionado] || {}).daily || [];

    let diaUnicoData: any = null;
    let diaUnicoTitle = '';
    if (subFiltroDia === 'diaUnico' && diaUnico && !loading) {
        const [yStr, mStr, dStr] = diaUnico.split('-');
        const dData = (salesData[Number(yStr)]?.[monthNames[Number(mStr) - 1]] as MonthData)?.daily.find(item => item.day === Number(dStr));
        if (dData) { diaUnicoData = dData; diaUnicoTitle = `Resumo: ${dStr}/${mStr}/${yStr}`; }
    }

    let periodoData: any = null;
    let periodoTitle = '';
    if (subFiltroDia === 'periodo' && diaInicio && diaFim && !loading) {
        const start = new Date(diaInicio + 'T00:00:00');
        const end = new Date(diaFim + 'T23:59:59');
        let total = 0, orders = 0;
        const payments = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };
        let found = false;
        Object.entries(salesData).forEach(([yKey, months]) => {
            Object.entries(months as YearData).forEach(([mName, mData]) => {
                (mData as MonthData).daily.forEach(day => {
                    const current = new Date(Number(yKey), monthMap[mName], day.day);
                    if (current >= start && current <= end) {
                        found = true; total += day.total; orders += day.orders;
                        payments.pix += day.payments.pix; payments.cartao += day.payments.cartao; payments.dinheiro += day.payments.dinheiro; payments.voucher += day.payments.voucher;
                    }
                });
            });
        });
        if (found) { periodoData = { total, orders, payments }; periodoTitle = `Período: ${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`; }
    }

    if (loading) return <Box p={10} display="flex" justifyContent="center"><CircularProgress /></Box>;

    return (
        <Stack spacing={3} sx={{ minWidth: { xs: '80vw', sm: '70vw', md: '50vw' } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <FormControl size="small" fullWidth><Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de Visão</Typography><Select value={tipoVisao} onChange={handleTipoVisaoChange}><MenuItem value="Mensal">Mensal</MenuItem><MenuItem value="Diário">Diário</MenuItem><MenuItem value="Anual">Anual</MenuItem></Select></FormControl>
                {tipoVisao === 'Mensal' && <FormControl size="small" fullWidth><Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>Ano</Typography><Select value={anoSelecionado} onChange={handleAnoChange}>{Object.keys(salesData).map(y => <MenuItem key={y} value={Number(y)}>{y}</MenuItem>)}</Select></FormControl>}
                {tipoVisao === 'Diário' && <FormControl size="small" fullWidth><Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>Mês</Typography><Select value={mesSelecionado} onChange={handleMesChange}>{Object.keys(dataAno).length > 0 ? Object.keys(dataAno).map(m => <MenuItem key={m} value={m}>{m}/{anoSelecionado}</MenuItem>) : <MenuItem disabled>Sem dados</MenuItem>}</Select></FormControl>}
            </Stack>
            {tipoVisao === 'Diário' && <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}><ToggleButtonGroup value={subFiltroDia} exclusive onChange={handleSubFiltroDiaChange} size="small" color="primary" fullWidth sx={{ mb: 2 }}><ToggleButton value="mesInteiro">Mês</ToggleButton><ToggleButton value="diaUnico">Dia</ToggleButton><ToggleButton value="periodo">Período</ToggleButton></ToggleButtonGroup>{subFiltroDia === 'diaUnico' && <TextField type="date" label="Dia" value={diaUnico} onChange={e => setDiaUnico(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />}{subFiltroDia === 'periodo' && <Stack direction="row" spacing={2}><TextField type="date" label="Início" value={diaInicio} onChange={e => setDiaInicio(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /><TextField type="date" label="Fim" value={diaFim} onChange={e => setDiaFim(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Stack>}</Paper>}
            {(tipoVisao === 'Mensal' || tipoVisao === 'Anual') && <PaymentLegend />}
            <Box>
                <Typography variant="h6" gutterBottom>{tipoVisao === 'Mensal' && `Vendas em ${anoSelecionado}`}{tipoVisao === 'Anual' && 'Histórico Anual'}{tipoVisao === 'Diário' && subFiltroDia === 'mesInteiro' && `Vendas de ${mesSelecionado}/${anoSelecionado}`}</Typography>
                {/* CORREÇÃO: Removido labelKey */}
                {tipoVisao === 'Anual' && <StackedBarChart data={yearlyData} />}
                {tipoVisao === 'Mensal' && <StackedBarChart data={monthlyData} />}
                {tipoVisao === 'Diário' && subFiltroDia === 'mesInteiro' && <DailyBarChart data={dailyData} />}
                {tipoVisao === 'Diário' && subFiltroDia === 'diaUnico' && (diaUnicoData ? <DailyPeriodSummary data={diaUnicoData} title={diaUnicoTitle} /> : <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}><Typography variant="body1">Nenhum dado encontrado.</Typography></Paper>)}
                {tipoVisao === 'Diário' && subFiltroDia === 'periodo' && (periodoData ? <DailyPeriodSummary data={periodoData} title={periodoTitle} /> : <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}><Typography variant="body1">{diaInicio && diaFim ? 'Nenhum dado no período.' : 'Selecione as datas.'}</Typography></Paper>)}
            </Box>
        </Stack>
    );
}