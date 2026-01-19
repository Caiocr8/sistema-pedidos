import React, { useState, useEffect } from 'react';
import { Box, Alert, Stack, InputAdornment } from '@mui/material';
import { Unlock, User } from 'lucide-react';
import StyledModal from '@/components/ui/modal';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';

interface AbrirCaixaModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (valor: number, operador: string) => void;
    loading: boolean;
    userNameDefault?: string | null;
}

export default function AbrirCaixaModal({ open, onClose, onConfirm, loading, userNameDefault }: AbrirCaixaModalProps) {
    const [valor, setValor] = useState('');
    const [operador, setOperador] = useState(userNameDefault || '');

    useEffect(() => {
        if (open) setOperador(userNameDefault || '');
    }, [open, userNameDefault]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(Number(valor), operador);
    };

    return (
        <StyledModal open={open} onClose={onClose} title="Abertura de Caixa">
            <Box component="form" onSubmit={handleSubmit}>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Confirme o operador responsável e o suprimento.
                </Alert>
                <Stack spacing={3}>
                    <Input
                        id="abertura-operador"
                        name="operador"
                        label="Nome do Operador"
                        value={operador}
                        onChange={(e) => setOperador(e.target.value)}
                        fullWidth
                        required
                        placeholder="Quem está abrindo o caixa?"
                        icon={<User size={18} />}
                    />
                    <Input
                        id="abertura-valor"
                        name="valorInicial"
                        label="Suprimento"
                        type="number"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        autoFocus
                        fullWidth
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>
                        }}
                    />
                </Stack>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button onClick={onClose} variant="text" color="inherit">Cancelar</Button>
                    <Button type="submit" loading={loading} variant="contained" startIcon={<Unlock />}>
                        Abrir Caixa
                    </Button>
                </Box>
            </Box>
        </StyledModal>
    );
}