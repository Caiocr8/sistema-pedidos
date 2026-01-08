import { useState } from 'react';
import { Box, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Typography, Avatar } from '@mui/material';
import { Camera } from 'lucide-react';
import Button from '@/components/ui/button';

interface FuncionarioModalProps {
    initialData?: any;
    onClose: () => void;
}

export default function FuncionarioModal({ initialData, onClose }: FuncionarioModalProps) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(initialData?.cargo || 'garcom');
    const [status, setStatus] = useState(initialData?.status || 'ativo');

    const handleSubmit = async () => {
        setLoading(true);
        // Simulação de delay de salvamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        onClose();
        // Aqui entra a lógica de salvar no Firebase depois
    };

    return (
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: { sm: 450 } }}>

            {/* Foto / Avatar */}
            <Box display="flex" justifyContent="center" mb={1}>
                <Box position="relative">
                    <Avatar
                        sx={{ width: 80, height: 80, bgcolor: 'primary.light', color: 'primary.main', fontSize: '2rem', fontWeight: 'bold' }}
                    >
                        {initialData?.nome?.[0] || 'N'}
                    </Avatar>
                    <Box
                        sx={{
                            position: 'absolute', bottom: 0, right: 0,
                            bgcolor: 'background.paper', borderRadius: '50%', p: 0.5,
                            boxShadow: 2, cursor: 'pointer', border: '1px solid #eee'
                        }}
                    >
                        <Camera size={16} />
                    </Box>
                </Box>
            </Box>

            <Stack spacing={2}>
                <TextField
                    label="Nome Completo"
                    fullWidth
                    defaultValue={initialData?.nome}
                    placeholder="Ex: João da Silva"
                />

                <TextField
                    label="E-mail"
                    type="email"
                    fullWidth
                    defaultValue={initialData?.email}
                    placeholder="joao@restaurante.com"
                />

                {!initialData && (
                    <TextField
                        label="Senha Inicial"
                        type="password"
                        fullWidth
                        placeholder="••••••••"
                    />
                )}

                <Stack direction="row" spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Cargo</InputLabel>
                        <Select
                            value={role}
                            label="Cargo"
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <MenuItem value="admin">Administrador</MenuItem>
                            <MenuItem value="garcom">Garçom</MenuItem>
                            <MenuItem value="cozinha">Cozinha</MenuItem>
                            <MenuItem value="caixa">Caixa</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={status}
                            label="Status"
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="ativo">Ativo</MenuItem>
                            <MenuItem value="ferias">Férias</MenuItem>
                            <MenuItem value="inativo">Inativo</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button variant="outlined" color="inherit" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    loading={loading}
                >
                    {initialData ? 'Salvar Alterações' : 'Criar Conta'}
                </Button>
            </Box>
        </Box>
    );
}