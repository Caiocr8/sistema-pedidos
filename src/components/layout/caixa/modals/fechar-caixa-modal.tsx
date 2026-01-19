import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stack, CircularProgress, Alert, Divider, InputAdornment
} from '@mui/material';
import { AlertTriangle, Lock } from 'lucide-react';
import { getDadosRelatorio, RelatorioData, CaixaSessao, Movimentacao } from '@/lib/services/caixa';
import StyledModal from '@/components/ui/modal';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

interface FecharCaixaModalProps {
    open: boolean;
    onClose: () => void;
    sessao: CaixaSessao | null;
    onConfirm: (dadosCompletos: RelatorioData) => void;
    loading: boolean;
    movimentacoes?: Movimentacao[];
}

export default function FecharCaixaModal({
    open,
    onClose,
    sessao,
    onConfirm,
    loading,
    movimentacoes = []
}: FecharCaixaModalProps) {
    const [step, setStep] = useState(1);
    const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
    const [confDinheiro, setConfDinheiro] = useState('');
    const [confCartao, setConfCartao] = useState('');
    const [obs, setObs] = useState('');

    useEffect(() => {
        if (open && sessao) {
            setStep(1);
            setConfDinheiro('');
            setConfCartao('');
            setObs('');

            getDadosRelatorio(sessao).then(data => {
                let dadosAjustados = { ...data };

                // Recalcula totais usando as movimentações da tela para precisão
                if (movimentacoes.length > 0) {
                    (dadosAjustados as any).movimentacoes = movimentacoes;

                    const totalSuprimentos = movimentacoes
                        .filter(m => m.tipo === 'suprimento')
                        .reduce((acc, curr) => acc + curr.valor, 0);

                    const totalSangrias = movimentacoes
                        .filter(m => m.tipo === 'sangria')
                        .reduce((acc, curr) => acc + curr.valor, 0);

                    // Esperado = Inicial + VendasDin + Suprimentos - Sangrias
                    const novoEsperadoDinheiro =
                        (sessao.valorInicial || 0) +
                        data.vendas.dinheiro +
                        totalSuprimentos -
                        totalSangrias;

                    dadosAjustados.esperado = {
                        ...data.esperado,
                        dinheiro: novoEsperadoDinheiro,
                        totalGeral: novoEsperadoDinheiro + data.esperado.cartaoPix
                    };
                }

                setRelatorio(dadosAjustados);
                setStep(2);
            });
        }
    }, [open, sessao, movimentacoes]);

    const handleConfirm = () => {
        if (!relatorio) return;
        const dinheiro = parseFloat(confDinheiro) || 0;
        const cartao = parseFloat(confCartao) || 0;

        const dadosFinais: RelatorioData = {
            ...relatorio,
            fechamento: {
                dinheiroContado: dinheiro,
                cartaoPixContado: cartao,
                totalGeralContado: dinheiro + cartao,
                diferenca: (dinheiro + cartao) - relatorio.esperado.totalGeral,
                observacoes: obs
            }
        };
        onConfirm(dadosFinais);
    };

    const difTotal = relatorio ? ((parseFloat(confDinheiro) || 0) + (parseFloat(confCartao) || 0)) - relatorio.esperado.totalGeral : 0;

    return (
        <StyledModal open={open} onClose={onClose} title="Fechamento de Caixa" maxWidth="md">
            <Box>
                {step === 1 && (
                    <Box p={6} display="flex" flexDirection="column" alignItems="center">
                        <CircularProgress />
                        <Typography mt={2}>Consolidando dados...</Typography>
                    </Box>
                )}

                {step === 2 && relatorio && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Confira os valores na gaveta e na maquineta antes de encerrar.
                        </Alert>

                        {/* LAYOUT GRID NATIVO (Substituindo Grid Component) */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, // 1 coluna mobile, 2 desktop
                            gap: 3,
                            alignItems: 'stretch' // Estica os cards para terem a mesma altura
                        }}>
                            {/* Coluna Esquerda: Esperado */}
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Card sx={{ bgcolor: 'action.hover', width: '100%', height: '100%', borderStyle: 'dashed' }} noPadding>
                                    <Box p={3} height="100%" display="flex" flexDirection="column" justifyContent="center">
                                        <Typography variant="overline" fontWeight={700} color="primary" gutterBottom>
                                            ESPERADO (SISTEMA)
                                        </Typography>
                                        <Stack spacing={2} mt={1}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">Dinheiro (Gaveta)</Typography>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    R$ {relatorio.esperado.dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">Cartão/Pix</Typography>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    R$ {relatorio.esperado.cartaoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <Divider />
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="h6" fontWeight={800} color="text.primary">TOTAL</Typography>
                                                <Typography variant="h6" fontWeight={800} color="primary.main">
                                                    R$ {relatorio.esperado.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Card>
                            </Box>

                            {/* Coluna Direita: Conferência */}
                            <Box>
                                <Typography variant="overline" fontWeight={700} color="text.secondary" gutterBottom display="block">
                                    CONFERÊNCIA (REAL)
                                </Typography>
                                <Stack spacing={2}>
                                    <Input
                                        id="conf-dinheiro"
                                        name="confDinheiro"
                                        label="Dinheiro Contado (Gaveta)"
                                        type="number"
                                        value={confDinheiro}
                                        onChange={(e) => setConfDinheiro(e.target.value)}
                                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                        fullWidth
                                        autoFocus
                                    />
                                    <Input
                                        id="conf-cartao"
                                        name="confCartao"
                                        label="Total Maquineta (Cartão+Pix)"
                                        type="number"
                                        value={confCartao}
                                        onChange={(e) => setConfCartao(e.target.value)}
                                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                        fullWidth
                                    />
                                </Stack>
                            </Box>
                        </Box>

                        {/* Card de Diferença */}
                        <Box sx={{
                            mt: 4,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: Math.abs(difTotal) < 0.05 ? 'success.light' : difTotal > 0 ? 'info.light' : 'error.light',
                            color: Math.abs(difTotal) < 0.05 ? 'success.dark' : difTotal > 0 ? 'info.dark' : 'error.dark'
                        }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                {Math.abs(difTotal) >= 0.05 ? <AlertTriangle size={28} /> : <Lock size={28} />}
                                <Box flex={1}>
                                    <Typography variant="h6" fontWeight={800} lineHeight={1}>
                                        DIFERENÇA: {difTotal > 0 ? '+' : ''}R$ {difTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} mt={0.5}>
                                        {Math.abs(difTotal) < 0.05
                                            ? 'Caixa batendo corretamente.'
                                            : difTotal < 0
                                                ? 'Falta de caixa (Quebra).'
                                                : 'Sobra de caixa.'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Input
                            id="obs-fechamento"
                            name="obsFechamento"
                            label="Observações do Fechamento"
                            multiline
                            rows={2}
                            fullWidth
                            sx={{ mt: 3 }}
                            value={obs}
                            onChange={(e) => setObs(e.target.value)}
                            placeholder="Justifique diferenças se houver..."
                        />

                        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                            <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                            <Button
                                onClick={handleConfirm}
                                loading={loading}
                                variant="contained"
                                color="primary"
                                startIcon={<Lock />}
                                size="large"
                            >
                                Encerrar Caixa Definitivamente
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </StyledModal>
    );
}