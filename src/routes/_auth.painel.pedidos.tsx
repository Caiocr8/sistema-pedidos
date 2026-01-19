import { createFileRoute, useRouter } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, Paper, CircularProgress, Stack } from '@mui/material';
import { Plus, Lock, Wallet } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, Firestore } from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';
import { useUserStore } from '@/store/user-store';
import { useCaixaStore } from '@/store/caixa-store';
import { getCaixaAberto } from '@/lib/services/caixa';

import Button from '@/components/ui/button';
import StyledModal from '@/components/ui/modal';
import NovoPedidoModal from '@/components/layout/pedidos/modals/novo-pedido';

// Componentes Modularizados
import PedidoCard from '@/components/layout/pedidos/cards/pedido-card';
import ComandaContent from '@/components/layout/pedidos/modals/comanda-content';

export const Route = createFileRoute('/_auth/painel/pedidos')({
    component: PedidosPage,
})

function PedidosPage() {
    const router = useRouter();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [novoOpen, setNovoOpen] = useState(false);
    const [caixaAlertOpen, setCaixaAlertOpen] = useState(false);
    const [verificandoCaixa, setVerificandoCaixa] = useState(false);

    const { user } = useUserStore();
    const { checkCaixaStatus } = useCaixaStore();

    useEffect(() => {
        checkCaixaStatus();
        const q = query(collection(db as Firestore, 'pedidos'), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
            setPedidos(data); setLoading(false);
        });
    }, [checkCaixaStatus]);

    const pedidoAtivo = useMemo(() => pedidos.find(p => p.docId === detailId), [pedidos, detailId]);

    useEffect(() => {
        if (detailId && !pedidoAtivo) setDetailId(null);
    }, [pedidoAtivo, detailId]);

    const mesasAtivas = pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado').length;

    const handleAbrirNovaMesa = async () => {
        if (!user?.uid) return;
        setVerificandoCaixa(true);
        try {
            const caixa = await getCaixaAberto(user.uid);
            if (!caixa) {
                setCaixaAlertOpen(true);
            } else {
                setNovoOpen(true);
            }
        } catch (error) {
            console.error("Erro ao verificar caixa:", error);
            alert("Erro ao verificar status do caixa.");
        } finally {
            setVerificandoCaixa(false);
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', width: '100%', mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box>
                    <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 1 }}>
                        Controle de Mesas
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {mesasAtivas} {mesasAtivas === 1 ? 'mesa ativa' : 'mesas ativas'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<Plus size={24} />}
                    onClick={handleAbrirNovaMesa}
                    loading={verificandoCaixa}
                    sx={{ borderRadius: 3, px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                    Nova Mesa
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
                {loading && <Box display="flex" justifyContent="center" mt={10}><CircularProgress size={60} /></Box>}
                {!loading && pedidos.length === 0 && (
                    <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'transparent', border: '2px dashed', borderColor: 'divider' }} elevation={0}>
                        <Typography variant="h5" color="text.secondary" fontWeight={600}>Salão Livre</Typography>
                    </Paper>
                )}
                <Stack spacing={2}>
                    {pedidos.map(p => (
                        (p.status !== 'entregue' && p.status !== 'cancelado') && (
                            <PedidoCard key={p.docId} pedido={p} onOpenDetails={() => setDetailId(p.docId)} />
                        )
                    ))}
                </Stack>
            </Box>

            <StyledModal open={!!detailId} onClose={() => setDetailId(null)} title="">
                {pedidoAtivo && <ComandaContent pedido={pedidoAtivo} onClose={() => setDetailId(null)} />}
            </StyledModal>

            <StyledModal open={novoOpen} onClose={() => setNovoOpen(false)} title="">
                <NovoPedidoModal onClose={() => setNovoOpen(false)} />
            </StyledModal>

            <StyledModal open={caixaAlertOpen} onClose={() => setCaixaAlertOpen(false)} title="Atenção Necessária">
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ bgcolor: 'warning.light', color: 'warning.dark', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <Lock size={40} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>Caixa Fechado</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Para abrir uma nova mesa e registrar pedidos, é necessário realizar a <b>abertura do caixa</b> primeiro.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="outlined" color="inherit" onClick={() => setCaixaAlertOpen(false)}>Fechar</Button>
                        <Button variant="contained" color="primary" onClick={() => router.navigate({ to: '/painel/caixa' })} startIcon={<Wallet size={18} />}>
                            Ir para o Caixa
                        </Button>
                    </Stack>
                </Box>
            </StyledModal>
        </Box>
    );
}