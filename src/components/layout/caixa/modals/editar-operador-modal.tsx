import React, { useState, useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import Modal from '@/components/ui/modal';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';

interface EditarOperadorModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (novoNome: string) => void;
    atual: string;
    loading: boolean;
}

export default function EditarOperadorModal({ open, onClose, onConfirm, atual, loading }: EditarOperadorModalProps) {
    const [novoNome, setNovoNome] = useState(atual || '');

    useEffect(() => {
        if (open) setNovoNome(atual || '');
    }, [open, atual]);

    return (
        <Modal open={open} onClose={onClose} title="Trocar Operador">
            <Box component="form" onSubmit={(e) => { e.preventDefault(); onConfirm(novoNome); }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Ao trocar o operador, um comprovante será impresso e a ação registrada.
                </Alert>
                <Input
                    label="Novo Nome do Operador"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    fullWidth
                    required
                />
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button onClick={onClose} variant="text">Cancelar</Button>
                    <Button type="submit" loading={loading} variant="contained" color="warning">
                        Confirmar Troca
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}