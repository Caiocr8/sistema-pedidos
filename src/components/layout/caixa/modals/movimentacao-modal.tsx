import React, { useState, useEffect } from 'react';
import { Box, Alert, Stack, InputAdornment } from '@mui/material';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';

interface MovimentacaoModalProps {
    type: 'sangria' | 'suprimento';
    open: boolean;
    onClose: () => void;
    onConfirm: (valor: number, motivo: string) => void;
    loading: boolean;
}

export default function MovimentacaoModal({ type, open, onClose, onConfirm, loading }: MovimentacaoModalProps) {
    const [valor, setValor] = useState('');
    const [motivo, setMotivo] = useState('');
    const isSangria = type === 'sangria';

    useEffect(() => {
        if (!open) {
            setValor('');
            setMotivo('');
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(Number(valor), motivo);
    };

    return (
        <Modal open={open} onClose={onClose} title={isSangria ? "Nova Sangria (Retirada)" : "Adicionar Dinheiro (Suprimento)"}>
            <Box component="form" onSubmit={handleSubmit}>
                <Alert severity={isSangria ? "warning" : "success"} icon={isSangria ? <TrendingDown /> : <TrendingUp />} sx={{ mb: 3 }}>
                    {isSangria
                        ? "Retirada de dinheiro da gaveta (ex: pagamento, vale)."
                        : "Entrada de dinheiro extra na gaveta (ex: troco adicional)."}
                </Alert>
                <Stack spacing={3}>
                    <Input
                        id="mov-valor"
                        name="movValor"
                        label="Valor"
                        type="number"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>
                        }}
                        autoFocus
                    />
                    <Input
                        id="mov-motivo"
                        name="movMotivo"
                        label="Motivo / Descrição"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        fullWidth
                        required
                        placeholder={isSangria ? "Ex: Pagamento Fornecedor" : "Ex: Troco adicional"}
                    />
                </Stack>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                    <Button type="submit" loading={loading} variant="contained" color={isSangria ? "error" : "success"}>
                        {isSangria ? 'Confirmar Retirada' : 'Adicionar Dinheiro'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}