'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Stack, MenuItem, FormControl, Select, Tooltip,
    ToggleButtonGroup, ToggleButton, TextField, Divider, LinearProgress, CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { db } from '@/lib/api/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

// --- Interfaces ---
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
interface YearData { [month: string]: MonthData }
interface SalesDataStructure { [year: number]: YearData }

// --- Helpers ---
const PAYMENT_COLORS = { pix: '#00C49F', cartao: '#0088FE', dinheiro: '#FFBB28', voucher: '#FF8042' };
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthMap: Record<string, number> = monthNames.reduce((acc, m, i) => ({ ...acc, [m]: i }), {});

// --- Subcomponentes Memoizados ---
const PaymentLegend = React.memo(() => (
    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
        {Object.entries(PAYMENT_COLORS).map(([key, color]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: '3px' }} />
                <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>{key}</Typography>
            </Box>
        ))}
    </Stack>
));

const StackedBarChart = React.memo(({ data }: { data: { label: string; total: number; payments: any }[] }) => {
    const maxTotal = Math.max(...data.map((d) => d.total)) || 1;
    return (
        <Box sx={{ display: 'flex', gap: 2, height: '300px', width: '100%', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto', bgcolor: 'background.paper', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3 } }}>
            {data.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mx: 'auto' }}>Sem dados.</Typography>}
            {data.map((item) => (
                <Stack key={item.label} sx={{ alignItems: 'center', gap: 1, height: '100%', justifyContent: 'flex-end', minWidth: '60px', flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(item.total)}</Typography>
                    <Tooltip arrow placement="top" title={<Stack p={1}>{Object.entries(item.payments).map(([k, v]: any) => (<Typography key={k} variant="caption" display="block">{k}: {formatCurrency(v)}</Typography>))}</Stack>}>
                        <Box sx={{ width: '60%', height: `${Math.max((item.total / maxTotal) * 100, 1)}%`, display: 'flex', flexDirection: 'column', bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden', cursor: 'pointer', '&:hover': { transform: 'scaleY(1.02)' }, transition: 'transform 0.2s' }}>
                            {Object.entries(item.payments).map(([k, v]: any) => (<Box key={k} sx={{ height: `${(v / item.total) * 100}%`, bgcolor: PAYMENT_COLORS[k as keyof typeof PAYMENT_COLORS] }} />))}
                        </Box>
                    </Tooltip>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{item.label}</Typography>
                </Stack>
            ))}
        </Box>
    );
});

const DailyBarChart = React.memo(({ data }: { data: { day: number; total: number; orders: number }[] }) => {
    if (!data.length) return <Paper variant="outlined" sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="body2" color="text.secondary">Sem dados.</Typography></Paper>;
    const maxTotal = Math.max(...data.map(d => d.total)) || 1;
    return (
        <Paper variant="outlined" sx={{ p: 2, height: '300px', width: '100%', display: 'flex', gap: 0.5, alignItems: 'flex-end', overflowX: 'auto', borderRadius: 2, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3 } }}>
            {data.map((item) => (
                <Tooltip key={item.day} arrow placement="top" title={`Dia ${item.day}: ${formatCurrency(item.total)} (${item.orders} pedidos)`}>
                    <Box sx={{ width: '24px', flexShrink: 0, height: `${(item.total / maxTotal) * 100}%`, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0', opacity: 0.8, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }} />
                </Tooltip>
            ))}
        </Paper>
    );
});

const DailyPeriodSummary = React.memo(({ data, title }: { data: { total: number; orders: number; payments: { [key: string]: number } }; title: string }) => {
    const ticketMedio = data.orders > 0 ? data.total / data.orders : 0;
    const totalPayments = Object.values(data.payments).reduce((a, b) => a + b, 0) || 1;
    return (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>{title}</Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }} justifyContent="space-between" textAlign={{ xs: 'left', sm: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total Vendido</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatCurrency(data.total)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Total de Pedidos</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.orders}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Ticket Médio</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(ticketMedio)}</Typography>
                    </Box>
                </Stack>
                <Divider />
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Vendas por Pagamento</Typography>
                    <Stack spacing={2}>
                        {Object.entries(data.payments).map(([key, value]) => (
                            <Box key={key}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(value)} <Typography component="span" variant="caption" color="text.secondary">({((value / totalPayments) * 100).toFixed(0)}%)</Typography></Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={(value / totalPayments) * 100} sx={{ height: 6, borderRadius: 3, backgroundColor: 'action.hover', '& .MuiLinearProgress-bar': { backgroundColor: PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS] } }} />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
});

export default function VendasModalContent() {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any[]>([]);

    const [tipoVisao, setTipoVisao] = useState('Mensal');
    const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
    const [mesSelecionado, setMesSelecionado] = useState(monthNames[new Date().getMonth()]);
    const [subFiltroDia, setSubFiltroDia] = useState('mesInteiro');
    const [diaUnico, setDiaUnico] = useState(new Date().toISOString().split('T')[0]);
    const [diaInicio, setDiaInicio] = useState('');
    const [diaFim, setDiaFim] = useState('');

    const handleSubFiltroDiaChange = (e: React.MouseEvent<HTMLElement>, newVal: string | null) => {
        if (newVal) setSubFiltroDia(newVal);
    };

    const handleTipoVisaoChange = (event: SelectChangeEvent) => setTipoVisao(event.target.value);
    const handleAnoChange = (event: SelectChangeEvent<number>) => {
        setAnoSelecionado(event.target.value as number);
    };
    const handleMesChange = (event: SelectChangeEvent) => setMesSelecionado(event.target.value);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'pedidos'), where('status', '==', 'entregue'));
                const snapshot = await getDocs(q);
                setRawData(snapshot.docs.map(d => d.data()));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetch();
    }, []);

    const salesData = useMemo(() => {
        const structure: SalesDataStructure = {};
        rawData.forEach(data => {
            const timestamp = data.pagamento?.data || data.createdAt;
            if (!timestamp) return;
            const date = timestamp.toDate();
            const year = date.getFullYear();
            const monthName = monthNames[date.getMonth()];
            const day = date.getDate();
            const total = data.total || 0;

            const pags = data.pagamento?.pagamentos || {};
            const methods = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };
            if (Object.keys(pags).length) {
                Object.entries(pags).forEach(([k, v]: any) => {
                    const kl = k.toLowerCase();
                    const val = Number(v);
                    if (kl.includes('pix')) methods.pix += val;
                    else if (kl.includes('dinheiro')) methods.dinheiro += val;
                    else if (kl.includes('vale') || kl.includes('voucher')) methods.voucher += val;
                    else methods.cartao += val;
                });
            } else methods.cartao = total;

            if (!structure[year]) structure[year] = {};
            if (!structure[year][monthName]) structure[year][monthName] = { total: 0, payments: { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 }, daily: [] };

            const mData = structure[year][monthName];
            mData.total += total;
            mData.payments.pix += methods.pix;
            mData.payments.cartao += methods.cartao;
            mData.payments.dinheiro += methods.dinheiro;
            mData.payments.voucher += methods.voucher;

            let dData = mData.daily.find(d => d.day === day);
            if (!dData) { dData = { day, total: 0, orders: 0, payments: { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 } }; mData.daily.push(dData); }
            dData.total += total;
            dData.orders += 1;
        });

        Object.values(structure).forEach((y: YearData) => {
            Object.values(y).forEach((m: MonthData) => {
                m.daily.sort((a: DailyData, b: DailyData) => a.day - b.day);
            });
        });

        return structure;
    }, [rawData]);

    const dataAno = salesData[anoSelecionado] || {};

    const monthlyData = useMemo(() =>
        monthNames.map(m => ({
            label: m,
            total: dataAno[m]?.total || 0,
            payments: dataAno[m]?.payments || { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 }
        })),
        [dataAno]);

    // --- CORREÇÃO: Somar pagamentos no YearlyData ---
    const yearlyData = useMemo(() =>
        Object.keys(salesData).map(yKey => {
            const yData = salesData[Number(yKey)];
            let total = 0;
            const payments = { pix: 0, cartao: 0, dinheiro: 0, voucher: 0 };

            Object.values(yData).forEach((mData: MonthData) => {
                total += mData.total;
                payments.pix += mData.payments.pix || 0;
                payments.cartao += mData.payments.cartao || 0;
                payments.dinheiro += mData.payments.dinheiro || 0;
                payments.voucher += mData.payments.voucher || 0;
            });

            return { label: yKey, total, payments };
        }),
        [salesData]);

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
        <Stack spacing={3} sx={{ width: '100%' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" fullWidth>
                    <Typography variant="caption" fontWeight={700} mb={0.5}>Visão</Typography>
                    <Select value={tipoVisao} onChange={handleTipoVisaoChange}>{['Mensal', 'Diário', 'Anual'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select>
                </FormControl>
                {tipoVisao === 'Mensal' && <FormControl size="small" fullWidth><Typography variant="caption" fontWeight={700} mb={0.5}>Ano</Typography><Select value={anoSelecionado} onChange={handleAnoChange}>{Object.keys(salesData).map(y => <MenuItem key={y} value={Number(y)}>{y}</MenuItem>)}</Select></FormControl>}
                {tipoVisao === 'Diário' && <FormControl size="small" fullWidth><Typography variant="caption" fontWeight={700} mb={0.5}>Mês</Typography><Select value={mesSelecionado} onChange={handleMesChange}>{monthNames.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl>}
            </Stack>

            {tipoVisao === 'Diário' && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <ToggleButtonGroup value={subFiltroDia} exclusive onChange={handleSubFiltroDiaChange} size="small" color="primary" fullWidth sx={{ mb: 2 }}>
                        <ToggleButton value="mesInteiro">Mês</ToggleButton>
                        <ToggleButton value="diaUnico">Dia</ToggleButton>
                        <ToggleButton value="periodo">Período</ToggleButton>
                    </ToggleButtonGroup>
                    {subFiltroDia === 'diaUnico' && <TextField type="date" label="Dia" value={diaUnico} onChange={e => setDiaUnico(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} size="small" />}
                    {subFiltroDia === 'periodo' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField type="date" label="Início" value={diaInicio} onChange={e => setDiaInicio(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} size="small" /><TextField type="date" label="Fim" value={diaFim} onChange={e => setDiaFim(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} size="small" /></Stack>}
                </Paper>
            )}

            <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>{tipoVisao === 'Mensal' ? `Vendas ${anoSelecionado}` : tipoVisao}</Typography>
                {tipoVisao === 'Anual' && <StackedBarChart data={yearlyData as any} />}
                {tipoVisao === 'Mensal' && <StackedBarChart data={monthlyData} />}
                {tipoVisao === 'Diário' && subFiltroDia === 'mesInteiro' && <DailyBarChart data={dailyData} />}

                {tipoVisao === 'Diário' && subFiltroDia === 'diaUnico' && (
                    diaUnicoData
                        ? <DailyPeriodSummary data={diaUnicoData} title={diaUnicoTitle} />
                        : <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}><Typography variant="body1" color="text.secondary">Nenhum dado encontrado para este dia.</Typography></Paper>
                )}

                {tipoVisao === 'Diário' && subFiltroDia === 'periodo' && (
                    periodoData
                        ? <DailyPeriodSummary data={periodoData} title={periodoTitle} />
                        : <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}><Typography variant="body1" color="text.secondary">{diaInicio && diaFim ? 'Nenhum dado no período.' : 'Selecione as datas para filtrar.'}</Typography></Paper>
                )}
            </Box>
            <PaymentLegend />
        </Stack>
    );
}