'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider, CircularProgress, Avatar, Chip } from '@mui/material';
import { CircleX, Calendar, ShoppingBasket, Layers } from 'lucide-react';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// Interface unificada para exibição
interface CancelamentoDisplay {
    id: string;
    tipo: 'mesa' | 'item';
    mesa: string;
    total: number;
    motivo?: string;
    data: Date;
    itensDetalhados: { nome: string; qtd: number }[];
}

export default function CanceladosModalContent() {
    const [listaCancelamentos, setListaCancelamentos] = useState<CancelamentoDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayTs = Timestamp.fromDate(today);

                // 1. Busca na coleção principal 'pedidos' de hoje
                const qPedidos = query(
                    collection(db, 'pedidos'),
                    where('createdAt', '>=', todayTs)
                );

                const snap = await getDocs(qPedidos);
                const listaTemp: CancelamentoDisplay[] = [];

                snap.forEach((doc) => {
                    const d = doc.data();
                    const dataPedido = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();

                    // CASO 1: MESA INTEIRA CANCELADA (Status 'cancelado')
                    if (d.status === 'cancelado') {
                        listaTemp.push({
                            id: doc.id,
                            tipo: 'mesa',
                            mesa: d.mesa,
                            total: d.total || 0,
                            motivo: d.motivoCancelamento || d.reason || 'Cancelamento Total',
                            data: d.cancelledAt?.toDate ? d.cancelledAt.toDate() : dataPedido,
                            itensDetalhados: d.itens?.map((i: any) => ({ nome: i.nome, qtd: i.quantidade })) || []
                        });
                    }
                    // CASO 2: ITENS CANCELADOS EM PEDIDOS ATIVOS/ENTREGUES
                    else if (d.itens && Array.isArray(d.itens)) {
                        // Filtra itens com flag cancelado: true
                        const itensCancelados = d.itens.filter((i: any) => i.cancelado === true);

                        if (itensCancelados.length > 0) {
                            // Calcula total dos itens cancelados
                            const totalCancelado = itensCancelados.reduce((acc: number, i: any) => acc + (i.precoUnitario * i.quantidade), 0);

                            // Motivo e Data (pega do primeiro item)
                            const motivoItem = itensCancelados[0].motivoCancelamento || 'Item cancelado individualmente';
                            const dataItem = itensCancelados[0].canceladoEm?.toDate ? itensCancelados[0].canceladoEm.toDate() : dataPedido;

                            listaTemp.push({
                                id: doc.id + '_itens', // ID único virtual
                                tipo: 'item',
                                mesa: d.mesa,
                                total: totalCancelado,
                                motivo: motivoItem,
                                data: dataItem,
                                itensDetalhados: itensCancelados.map((i: any) => ({ nome: i.nome, qtd: i.quantidade }))
                            });
                        }
                    }
                });

                // 2. Busca legado na coleção 'pedidos_cancelados' (para compatibilidade)
                try {
                    const qLegacy = query(collection(db, 'pedidos_cancelados'), where('cancelledAt', '>=', todayTs));
                    const snapLegacy = await getDocs(qLegacy);
                    snapLegacy.forEach(doc => {
                        const d = doc.data();
                        listaTemp.push({
                            id: doc.id,
                            tipo: 'mesa',
                            mesa: d.mesa,
                            total: d.total || 0,
                            motivo: d.reason || d.motivo || 'Cancelamento (Legado)',
                            data: d.cancelledAt?.toDate ? d.cancelledAt.toDate() : new Date(),
                            itensDetalhados: d.itens?.map((i: any) => ({ nome: i.nome, qtd: i.quantidade })) || []
                        });
                    });
                } catch (err) {
                    // Ignora silenciosamente
                }

                // Ordena por data (mais recente primeiro)
                const todos = listaTemp.sort((a, b) => b.data.getTime() - a.data.getTime());
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
                        elevation={2}
                        sx={{
                            p: 2,
                            borderLeft: `5px solid`,
                            borderColor: isMesa ? 'error.main' : 'warning.main',
                            // Removemos bgcolors forçados para usar o padrão do tema (dark/light)
                            bgcolor: 'background.paper',
                        }}
                    >
                        {/* Cabeçalho */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" gap={1.5} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: 40, height: 40,
                                        // Cores de fundo suaves que funcionam bem com ícones escuros
                                        bgcolor: isMesa ? 'error.main' : 'warning.main',
                                        color: '#fff'
                                    }}
                                >
                                    {isMesa ? <Layers size={20} /> : <ShoppingBasket size={20} />}
                                </Avatar>
                                <Box>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                            {isMesa ? `Mesa ${cancelamento.mesa}` : `Mesa ${cancelamento.mesa}`}
                                        </Typography>
                                        <Chip
                                            label={isMesa ? "Cancelamento Total" : "Item Cancelado"}
                                            size="small"
                                            color={isMesa ? "error" : "warning"}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                        />
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                                        <Calendar size={14} style={{ opacity: 0.6 }} />
                                        <Typography variant="caption" color="text.secondary">{dateStr} às {timeStr}</Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                            <Typography variant="h6" fontWeight={700} color={isMesa ? "error.main" : "warning.main"}>
                                - R$ {cancelamento.total.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Lista de Itens */}
                        <Box mb={2}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                                ITENS:
                            </Typography>
                            {cancelamento.itensDetalhados && cancelamento.itensDetalhados.length > 0 ? (
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {cancelamento.itensDetalhados.map((item, idx) => (
                                        <Chip
                                            key={idx}
                                            label={`${item.qtd}x ${item.nome}`}
                                            size="small"
                                            sx={{
                                                // Garante contraste no chip
                                                bgcolor: 'action.hover',
                                                color: 'text.primary',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                fontWeight: 500
                                            }}
                                        />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                    Lista de itens indisponível.
                                </Typography>
                            )}
                        </Box>

                        {/* Motivo */}
                        <Box display="flex" gap={1.5} p={1.5} bgcolor="action.hover" borderRadius={1} border="1px solid" borderColor="divider">
                            <CircleX size={18} color="#d32f2f" style={{ marginTop: 2, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>MOTIVO REGISTRADO</Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
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