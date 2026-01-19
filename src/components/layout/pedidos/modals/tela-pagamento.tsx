import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Chip, Stack, ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, RadioGroup, FormControlLabel, Radio, InputAdornment, Divider } from '@mui/material';
import { ArrowLeft, CheckCircle, Ban, Ticket, Percent, Coins, CreditCard, X, Printer, AlertTriangle } from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { useCaixaStore } from '@/store/caixa-store';
import { processarVenda } from '@/lib/services/caixa';
import { gerarViasRecibo, imprimirRelatorio } from '@/lib/utils/print-service';
import Button from '@/components/ui/button';
import Input from '@/components/forms/input';
import Card from '@/components/ui/card';
import StyledModal from '@/components/ui/modal';

// --- FUNÇÕES DE MÁSCARA ---
const formatarDocumento = (valor: string, tipo: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');

    if (tipo === 'CPF') {
        const v = apenasNumeros.slice(0, 11);
        return v
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        const v = apenasNumeros.slice(0, 14);
        return v
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
};

interface TelaPagamentoProps {
    pedido: any;
    onVoltar: () => void;
    onFinalizar: () => void;
}

export default function TelaPagamento({ pedido, onVoltar, onFinalizar }: TelaPagamentoProps) {
    const { user } = useUserStore();
    const { caixaId, caixaAberto } = useCaixaStore();

    const [valores, setValores] = useState<Record<string, number>>({
        'Dinheiro': 0, 'Pix': 0, 'Cartão Crédito': 0, 'Cartão Débito': 0, 'Vale Refeição': 0
    });

    const [parcelas, setParcelas] = useState(1);
    const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor'>('valor');
    const [valorDescontoInput, setValorDescontoInput] = useState<string>('');
    const [docCliente, setDocCliente] = useState('');
    const [tipoDoc, setTipoDoc] = useState('CPF');
    const [loading, setLoading] = useState(false);

    // Modais
    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [modalErroUser, setModalErroUser] = useState(false); // Novo estado para erro de usuário
    const [modalErroCaixa, setModalErroCaixa] = useState(false); // Novo estado para erro de caixa fechado

    const [textoViaCliente, setTextoViaCliente] = useState('');

    useEffect(() => {
        setDocCliente('');
    }, [tipoDoc]);

    const subtotal = pedido.total;
    let descontoCalculado = 0;
    const descInput = parseFloat(valorDescontoInput) || 0;

    if (tipoDesconto === 'porcentagem') {
        descontoCalculado = (subtotal * descInput) / 100;
    } else {
        descontoCalculado = descInput;
    }
    if (descontoCalculado > subtotal) descontoCalculado = subtotal;

    const totalComDesconto = subtotal - descontoCalculado;
    const totalPago = Object.values(valores).reduce((acc, val) => acc + val, 0);
    const saldo = totalComDesconto - totalPago;
    const troco = saldo < 0 ? Math.abs(saldo) : 0;
    const restante = saldo > 0 ? saldo : 0;
    const prontoParaFinalizar = saldo <= 0.01;

    const handleValorChange = (metodo: string, valorStr: string) => {
        let novoValor = parseFloat(valorStr);
        if (isNaN(novoValor) || novoValor < 0) novoValor = 0;

        if (metodo !== 'Dinheiro') {
            const outrosPagamentos = Object.entries(valores)
                .filter(([key]) => key !== metodo)
                .reduce((acc, [_, val]) => acc + val, 0);
            const maxPermitido = Math.max(0, totalComDesconto - outrosPagamentos);
            if (novoValor > maxPermitido) novoValor = maxPermitido;
        }
        setValores(prev => ({ ...prev, [metodo]: novoValor }));
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valorFormatado = formatarDocumento(e.target.value, tipoDoc);
        setDocCliente(valorFormatado);
    };

    const handleConcluir = async () => {
        // --- SUBSTITUIÇÃO DOS ALERTS POR MODAIS ---
        if (!user?.uid) {
            setModalErroUser(true);
            return;
        }
        if (!caixaAberto || !caixaId) {
            setModalErroCaixa(true);
            return;
        }
        // ------------------------------------------

        setLoading(true);
        try {
            await processarVenda(
                caixaId,
                pedido.docId,
                totalComDesconto,
                valores,
                troco,
                descontoCalculado,
                user.uid
            );

            const vias = gerarViasRecibo(
                { ...pedido, total: subtotal, valorOriginal: subtotal },
                valores,
                troco,
                docCliente,
                tipoDoc,
                descontoCalculado > 0 ? { valorCalculado: descontoCalculado } : undefined,
                valores['Cartão Crédito'] > 0 ? parcelas : 1
            );

            imprimirRelatorio(vias.viaEstabelecimento);
            setTextoViaCliente(vias.viaCliente);
            setModalClienteOpen(true);
            setLoading(false);

        } catch (error: any) {
            console.error(error);
            alert(`Erro ao finalizar venda: ${error.message}`); // Esse alert de erro do sistema pode ser mantido ou trocado por um toast futuramente
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <IconButton onClick={onVoltar} size="small"><ArrowLeft /></IconButton>
                <Typography variant="h5" fontWeight={700}>Pagamento / Fechamento</Typography>
                {caixaAberto ? (
                    <Chip label="Caixa Aberto" color="success" size="small" variant="outlined" icon={<CheckCircle size={14} />} />
                ) : (
                    <Chip label="Caixa Fechado" color="error" size="small" variant="filled" icon={<Ban size={14} />} />
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 3, height: '100%', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
                <Stack spacing={2} sx={{ flex: 1.5, overflowY: 'auto', pr: 1, pb: 2 }}>

                    <Card noPadding>
                        <Box p={2}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Ticket size={18} className="text-orange-500" />
                                <Typography variant="subtitle2" fontWeight={700}>Desconto</Typography>
                            </Box>
                            <Stack direction="row" spacing={2}>
                                <ToggleButtonGroup
                                    value={tipoDesconto}
                                    exclusive
                                    onChange={(_, v) => v && setTipoDesconto(v)}
                                    size="small"
                                    sx={{ height: 40 }}
                                >
                                    <ToggleButton value="valor" sx={{ px: 2 }}>R$</ToggleButton>
                                    <ToggleButton value="porcentagem" sx={{ px: 2 }}><Percent size={14} /></ToggleButton>
                                </ToggleButtonGroup>
                                <Input
                                    placeholder={tipoDesconto === 'porcentagem' ? "0%" : "0,00"}
                                    type="number"
                                    size="small"
                                    value={valorDescontoInput}
                                    onChange={(e) => setValorDescontoInput(e.target.value)}
                                    InputProps={{
                                        startAdornment: tipoDesconto === 'valor' ? <InputAdornment position="start">R$</InputAdornment> : undefined,
                                        endAdornment: tipoDesconto === 'porcentagem' ? <InputAdornment position="end">%</InputAdornment> : undefined
                                    }}
                                />
                            </Stack>
                            {descontoCalculado > 0 && (
                                <Typography variant="caption" color="success.main" fontWeight={600} mt={1} display="block">
                                    Desconto aplicado: - R$ {descontoCalculado.toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    </Card>

                    <Card sx={{ flex: 1 }} noPadding>
                        <Box p={2}>
                            <Typography variant="subtitle2" fontWeight={700} mb={2}>Formas de Pagamento</Typography>
                            <Stack spacing={2}>
                                {Object.keys(valores).map((metodo) => {
                                    const isDinheiro = metodo === 'Dinheiro';
                                    const isCredito = metodo === 'Cartão Crédito';
                                    const isFilled = valores[metodo] > 0;
                                    const pagoOutros = Object.entries(valores).filter(([k]) => k !== metodo).reduce((a, b) => a + b[1], 0);
                                    const falta = Math.max(0, totalComDesconto - pagoOutros);

                                    return (
                                        <Box key={metodo} display="flex" alignItems="center" gap={2}>
                                            <Box flex={1} display="flex" alignItems="center" gap={1.5}>
                                                {isDinheiro ? <Coins size={20} className="text-green-600" /> :
                                                    metodo === 'Pix' ? <img src="https://img.icons8.com/color/48/pix.png" width={20} alt="pix" style={{ filter: 'grayscale(100%)' }} /> :
                                                        <CreditCard size={20} className="text-gray-400" />}
                                                <Typography variant="body2" fontWeight={isFilled ? 600 : 400} color={isFilled ? 'text.primary' : 'text.secondary'}>
                                                    {metodo}
                                                </Typography>
                                            </Box>
                                            {isCredito && (
                                                <FormControl size="small" sx={{ width: 90 }}>
                                                    <Select
                                                        value={parcelas}
                                                        onChange={(e) => setParcelas(Number(e.target.value))}
                                                        displayEmpty
                                                        sx={{ fontSize: '0.875rem' }}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                                                            <MenuItem key={p} value={p}>{p}x</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                            <Input
                                                placeholder={falta > 0 && !isDinheiro ? `Máx ${falta.toFixed(2)}` : "0,00"}
                                                type="number"
                                                size="small"
                                                value={valores[metodo] === 0 ? '' : valores[metodo]}
                                                onChange={(e) => handleValorChange(metodo, e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                                sx={{ width: 130, '& input': { fontWeight: 'bold', textAlign: 'right' } }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </Card>

                    <Box sx={{ pt: 1 }}>
                        <Typography variant="caption" color="text.secondary" onClick={() => setDocCliente(prev => prev ? '' : ' ')} sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                            {docCliente === '' && 'Adicionar CPF/CNPJ na nota?'}
                        </Typography>
                        {docCliente !== '' && (
                            <Card noPadding sx={{ mt: 1 }}>
                                <Box p={1.5}>
                                    <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                                        <RadioGroup row value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                                            <FormControlLabel value="CPF" control={<Radio size="small" />} label={<Typography variant="caption">CPF</Typography>} />
                                            <FormControlLabel value="CNPJ" control={<Radio size="small" />} label={<Typography variant="caption">CNPJ</Typography>} />
                                        </RadioGroup>
                                    </Stack>
                                    <Input
                                        placeholder={tipoDoc === 'CPF' ? "000.000.000-00" : "00.000.000/0000-00"}
                                        size="small"
                                        value={docCliente === ' ' ? '' : docCliente}
                                        onChange={handleDocChange}
                                        inputProps={{
                                            maxLength: tipoDoc === 'CPF' ? 14 : 18
                                        }}
                                    />
                                </Box>
                            </Card>
                        )}
                    </Box>
                </Stack>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: { md: 350 } }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>RESUMO FINANCEIRO</Typography>
                            <Box mt={2}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography>R$ {subtotal.toFixed(2)}</Typography>
                                </Box>
                                {descontoCalculado > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1} color="error.main">
                                        <Typography>Desconto</Typography>
                                        <Typography>- R$ {descontoCalculado.toFixed(2)}</Typography>
                                    </Box>
                                )}
                                <Divider sx={{ my: 2 }} />
                                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                    <Typography variant="h6" fontWeight={700}>TOTAL</Typography>
                                    <Typography variant="h4" fontWeight={800} color="primary.main">R$ {totalComDesconto.toFixed(2)}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ my: 4, bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Valor Recebido</Typography>
                                <Typography variant="body1" fontWeight={600} color="success.main">R$ {totalPago.toFixed(2)}</Typography>
                            </Box>

                            {troco > 0 ? (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} borderTop="1px dashed #ccc">
                                    <Typography variant="subtitle1" color="primary.main" fontWeight={700}>TROCO</Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">R$ {troco.toFixed(2)}</Typography>
                                </Box>
                            ) : (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} borderTop="1px dashed #ccc">
                                    <Typography variant="body2" color="text.secondary">Faltam</Typography>
                                    <Typography variant="h6" fontWeight={700} color={restante > 0 ? "error.main" : "text.disabled"}>
                                        R$ {restante.toFixed(2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            color={!caixaAberto ? "error" : (prontoParaFinalizar ? "success" : "inherit")}
                            size="large"
                            disabled={!prontoParaFinalizar || loading || !caixaAberto}
                            onClick={handleConcluir}
                            startIcon={!caixaAberto ? <Ban /> : <Printer />}
                            loading={loading}
                            sx={{ height: 60, fontSize: '1.1rem', boxShadow: prontoParaFinalizar ? 4 : 0 }}
                        >
                            {!caixaAberto ? 'CAIXA FECHADO' : (prontoParaFinalizar ? 'FINALIZAR E IMPRIMIR' : 'AGUARDANDO PAGAMENTO')}
                        </Button>
                    </Card>
                </Box>
            </Box>

            {/* --- MODAIS DE ERRO E RECIBO --- */}

            {/* Modal de Erro: Usuário */}
            <StyledModal
                open={modalErroUser}
                onClose={() => setModalErroUser(false)}
                title="Erro de Identificação"
                maxWidth="xs"
            >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ bgcolor: 'error.light', color: 'error.main', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <Ban size={32} />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight={700}>Usuário não identificado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Não foi possível identificar o operador logado. Tente recarregar a página.
                    </Typography>
                    <Button fullWidth variant="contained" color="primary" onClick={() => setModalErroUser(false)}>
                        Entendi
                    </Button>
                </Box>
            </StyledModal>

            {/* Modal de Erro: Caixa Fechado */}
            <StyledModal
                open={modalErroCaixa}
                onClose={() => setModalErroCaixa(false)}
                title="Atenção"
                maxWidth="xs"
            >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box sx={{ bgcolor: 'warning.light', color: 'warning.dark', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <AlertTriangle size={32} />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight={700}>Caixa Fechado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Você precisa abrir o caixa no painel "Caixa" antes de receber pagamentos.
                    </Typography>
                    <Button fullWidth variant="contained" color="warning" onClick={() => setModalErroCaixa(false)}>
                        Entendi
                    </Button>
                </Box>
            </StyledModal>

            {/* Modal de Recibo */}
            <StyledModal
                open={modalClienteOpen}
                onClose={() => { setModalClienteOpen(false); onFinalizar(); }}
                title="Impressão de Recibo"
                maxWidth="sm"
            >
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Venda Registrada no Caixa!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        A via do estabelecimento foi impressa e o saldo atualizado. <br />Deseja imprimir a <b>Via do Cliente</b>?
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="outlined" color="inherit" size="large" onClick={() => { setModalClienteOpen(false); onFinalizar(); }} startIcon={<X />} sx={{ minWidth: 140 }}>
                            Não (Fechar)
                        </Button>
                        <Button variant="contained" color="primary" size="large" onClick={() => { imprimirRelatorio(textoViaCliente); setModalClienteOpen(false); onFinalizar(); }} startIcon={<Printer />} sx={{ minWidth: 140 }}>
                            Sim, Imprimir
                        </Button>
                    </Stack>
                </Box>
            </StyledModal>
        </Box>
    );
}