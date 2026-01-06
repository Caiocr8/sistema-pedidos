import { useState } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { AlertTriangle } from 'lucide-react';
// Importando seu botão personalizado
import StyledButton from '@/components/ui/button';

interface CancelarModalProps {
    titulo?: string;
    descricao?: string;
    onConfirm: (motivo: string) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function CancelarModal({
    titulo = "Cancelar Pedido",
    descricao = "Esta ação é irreversível.",
    onConfirm,
    onCancel,
    loading
}: CancelarModalProps) {
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (motivo.trim().length < 3) {
            setError('Por favor, informe o motivo.');
            return;
        }
        onConfirm(motivo);
    };

    return (
        <Box sx={{ p: 1, minWidth: { sm: 400 } }}>
            <Box display="flex" alignItems="center" gap={2} mb={2} color="error.main">
                <AlertTriangle size={32} />
                <Typography variant="h6" fontWeight={700}>{titulo}</Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" mb={3}>
                {descricao}
            </Typography>

            <TextField
                label="Motivo do Cancelamento"
                multiline
                rows={3}
                fullWidth
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); setError(''); }}
                placeholder="Ex: Cliente desistiu, prato frio, erro de lançamento..."
                error={!!error}
                helperText={error}
                autoFocus
            />

            <Box display="flex" gap={2} mt={4} justifyContent="flex-end">
                {/* Botão Voltar usando seu componente */}
                <StyledButton
                    onClick={onCancel}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                >
                    Voltar
                </StyledButton>

                {/* Botão Confirmar usando seu componente com prop loading */}
                <StyledButton
                    onClick={handleConfirm}
                    variant="contained"
                    color="error"
                    loading={loading}
                >
                    Confirmar
                </StyledButton>
            </Box>
        </Box>
    );
}