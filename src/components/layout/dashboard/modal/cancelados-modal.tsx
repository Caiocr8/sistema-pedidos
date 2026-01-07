'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider, CircularProgress, Avatar, Chip } from '@mui/material';
import { CircleX, Calendar, Hash, ShoppingBasket, Layers } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// Tipagem unificada para exibição
interface CancelamentoDisplay {
    id: string;
    tipo: 'mesa' | 'item';
    mesa: string;
    total: number;
    motivo: string;
    data: Date;
    itensDetalhados: { nome: string; qtd: number }[]; // Lista para exibir
}

export default function CanceladosModalContent() {
    const [listaCancelamentos, setListaCancelamentos] = useState<CancelamentoDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Buscar Mesas Canceladas
                const qMesas = query(collection(db, 'pedidos_cancelados'), orderBy('cancelledAt', 'desc'), limit(20));

                // 2. Buscar Itens Cancelados Individualmente
                const qItens = query(collection(db, 'itens_cancelados'), orderBy('canceladoEm', 'desc'), limit(20));

                const [snapMesas, snapItens] = await Promise.all([getDocs(qMesas), getDocs(qItens)]);

                const mesasFormatadas: CancelamentoDisplay[] = snapMesas.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        tipo: 'mesa',
                        mesa: d.mesa,
                        total: d.total || 0,
                        motivo: d.motivoCancelamento || 'Sem motivo',
                        data: d.cancelledAt?.toDate ? d.cancelledAt.toDate() : new Date(),
                        itensDetalhados: d.itens?.map((i: any) => ({ nome: i.nome, qtd: i.quantidade })) || []
                    };
                });

                const itensFormatados: CancelamentoDisplay[] = snapItens.docs.map(doc => {
                    const d = doc.data();
                    const item = d.item || {};
                    return {
                        id: doc.id,
                        tipo: 'item',
                        mesa: d.mesa,
                        total: (item.precoUnitario * item.quantidade) || 0,
                        motivo: d.motivo || 'Sem motivo',
                        data: d.canceladoEm?.toDate ? d.canceladoEm.toDate() : new Date(),
                        itensDetalhados: [{ nome: item.nome, qtd: item.quantidade }]
                    };
                });

                // 3. Unificar e Ordenar por Data (Mais recente primeiro)
                const todos = [...mesasFormatadas, ...itensFormatados].sort((a, b) => b.data.getTime() - a.data.getTime());

                setListaCancelamentos(todos);
            } catch (e) {
                console.error("Erro ao buscar cancelamentos:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;

    return (
        <Stack spacing={2} sx={{ minWidth: { sm: 500 }, maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
            {listaCancelamentos.length === 0 && <Typography align="center" color="text.secondary">Nenhum cancelamento recente.</Typography>}

            {listaCancelamentos.map((cancelamento) => {
                const dateStr = cancelamento.data.toLocaleDateString('pt-BR');
                const timeStr = cancelamento.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const isMesa = cancelamento.tipo === 'mesa';

                return (
                    <Paper
                        key={cancelamento.id}
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderLeft: `4px solid`,
                            borderColor: isMesa ? 'error.main' : 'warning.main', // Vermelho para mesa, Laranja para item
                            bgcolor: isMesa ? 'error.lighter' : 'background.paper'
                        }}
                    >
                        {/* Cabeçalho do Card */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" gap={1.5} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 36, height: 36,
                                        bgcolor: isMesa ? 'error.light' : 'warning.light',
                                        color: isMesa ? 'error.dark' : 'warning.dark'
                                    }}
                                >
                                    {isMesa ? <Layers size={18} /> : <ShoppingBasket size={18} />}
                                </Avatar>
                                <Box>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            {isMesa ? `Mesa ${cancelamento.mesa} Cancelada` : `Item Cancelado (Mesa ${cancelamento.mesa})`}
                                        </Typography>
                                        {!isMesa && <Chip label="Item Avulso" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.6rem' }} />}
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <Calendar size={12} className="text-gray-500" />
                                        <Typography variant="caption" color="text.secondary">{dateStr} às {timeStr}</Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={700} color={isMesa ? "error.main" : "warning.dark"}>
                                - R$ {cancelamento.total.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                        {/* Lista de O QUE foi cancelado */}
                        <Box mb={2}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.5} display="block">
                                ITENS CANCELADOS:
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {cancelamento.itensDetalhados.map((item, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${item.qtd}x ${item.nome}`}
                                        size="small"
                                        sx={{ bgcolor: 'action.hover', fontWeight: 500 }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        {/* Motivo */}
                        <Box display="flex" gap={1} p={1.5} bgcolor="action.hover" borderRadius={1}>
                            <CircleX size={16} color="#d32f2f" style={{ marginTop: 2, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="error.main">MOTIVO REGISTRADO</Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                                    "{cancelamento.motivo}"
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                );
            })}
        </Stack>
    );
}