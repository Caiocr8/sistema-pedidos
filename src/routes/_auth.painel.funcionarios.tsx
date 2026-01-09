import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Avatar, Stack, CircularProgress
} from '@mui/material';
import { Plus, Trash2, UserCog, Shield, ShieldCheck, Utensils, MonitorCheck } from 'lucide-react';

// Firebase
import { db } from '@/lib/api/firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

// Componentes
import Button from '@/components/ui/button'; // Seu botão personalizado
import FuncionarioModal from '@/components/layout/funcionarios/modal/funcionario-modal';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'garcom' | 'caixa' | 'cozinha';
  status?: string;
}

export const Route = createFileRoute('/_auth/painel/funcionarios')({
  component: FuncionariosPage,
})

function FuncionariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'user'), orderBy('displayName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserData));
      setUsers(userData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover ${nome}?`)) {
      try {
        await deleteDoc(doc(db, 'user', id));
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Chip icon={<ShieldCheck size={14} />} label="Admin" color="primary" size="small" />;
      case 'caixa': return <Chip icon={<MonitorCheck size={14} />} label="Caixa" color="secondary" size="small" />;
      case 'garcom': return <Chip icon={<UserCog size={14} />} label="Garçom" color="success" size="small" />;
      case 'cozinha': return <Chip icon={<Utensils size={14} />} label="Cozinha" color="warning" size="small" />;
      default: return <Chip label={role} size="small" />;
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Gestão de Equipe</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie os acessos e funções dos colaboradores</Typography>
        </Box>
        {/* Botão de Adicionar usando seu componente */}
        <Button
          onClick={() => setModalOpen(true)}
          startIcon={<Plus size={18} />}
          variant="contained"
        >
          Novo Funcionário
        </Button>
      </Box>

      <Paper elevation={2}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Colaborador</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {user.displayName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {user.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Chip label="Ativo" size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id, user.displayName)}
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      Nenhum funcionário cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <FuncionarioModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Box>
  );
}