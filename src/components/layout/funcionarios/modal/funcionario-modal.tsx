import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    Stack, Alert
} from '@mui/material';
import Button from '@/components/ui/button'; // Usa o seu botão personalizado

// Firebase Imports
import { deleteApp } from 'firebase/app';
import { initializeApp as initApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/api/firebase/config';

interface FuncionarioModalProps {
    open: boolean;
    onClose: () => void;
}

export default function FuncionarioModal({ open, onClose }: FuncionarioModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cargo, setCargo] = useState('garcom');

    const handleSave = async () => {
        if (!nome || !email || !senha) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }
        if (senha.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');

        // TÉCNICA DO APP SECUNDÁRIO para não deslogar o admin
        const secondaryApp = initApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
            const user = userCredential.user;

            await updateProfile(user, { displayName: nome });

            await setDoc(doc(db, 'user', user.uid), {
                uid: user.uid,
                displayName: nome,
                email: email,
                role: cargo,
                createdAt: serverTimestamp(),
                status: 'ativo'
            });

            handleClose();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está em uso.');
            } else {
                setError('Erro ao criar funcionário.');
            }
        } finally {
            await deleteApp(secondaryApp);
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNome('');
        setEmail('');
        setSenha('');
        setCargo('garcom');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 600 }}>Novo Membro da Equipe</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Nome Completo"
                        fullWidth
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />

                    <TextField
                        label="E-mail de Acesso"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Senha Inicial"
                            type="password"
                            fullWidth
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            helperText="Mínimo 6 caracteres"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Cargo / Função</InputLabel>
                            <Select
                                value={cargo}
                                label="Cargo / Função"
                                onChange={(e) => setCargo(e.target.value)}
                            >
                                <MenuItem value="garcom">Garçom</MenuItem>
                                <MenuItem value="caixa">Caixa</MenuItem>
                                <MenuItem value="cozinha">Cozinha</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                {/* Botão de Cancelar usando variant text */}
                <Button
                    variant="text"
                    onClick={handleClose}
                    disabled={loading}
                    color="inherit" // Para ficar cinza/neutro se desejar
                >
                    Cancelar
                </Button>

                {/* Botão de Salvar usando loading nativo do seu componente */}
                <Button
                    onClick={handleSave}
                    loading={loading}
                    loadingText="Criando..."
                    variant="contained"
                >
                    Criar Funcionário
                </Button>
            </DialogActions>
        </Dialog>
    );
}