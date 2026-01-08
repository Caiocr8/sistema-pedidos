import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Avatar, Stack, Tooltip
} from '@mui/material';
import { Plus, Pencil, Trash2, Shield, User, MoreVertical } from 'lucide-react';
import Button from '@/components/ui/button';
import StyledModal from '@/components/ui/modal';
import FuncionarioModal from '@/components/layout/funcionarios/modal/funcionario-modal';

export const Route = createFileRoute('/_auth/painel/funcionarios')({
  component: FuncionariosPage,
})

// Mock inicial para visualização
const MOCK_FUNCIONARIOS = [
  { id: 1, nome: 'Caio Ribeiro', email: 'caio@exemplo.com', cargo: 'admin', status: 'ativo', avatar: 'C' },
  { id: 2, nome: 'Maria Silva', email: 'maria@exemplo.com', cargo: 'garcom', status: 'ativo', avatar: 'M' },
  { id: 3, nome: 'João Souza', email: 'joao@exemplo.com', cargo: 'cozinha', status: 'ferias', avatar: 'J' },
  { id: 4, nome: 'Ana Costa', email: 'ana@exemplo.com', cargo: 'caixa', status: 'inativo', avatar: 'A' },
];

const roleMap: Record<string, { label: string, color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', icon: any }> = {
  admin: { label: 'Administrador', color: 'primary', icon: Shield },
  garcom: { label: 'Garçom', color: 'success', icon: User },
  cozinha: { label: 'Cozinha', color: 'warning', icon: User },
  caixa: { label: 'Caixa', color: 'info', icon: User },
};

const statusMap: Record<string, { label: string, color: 'success' | 'error' | 'warning' | 'default' }> = {
  ativo: { label: 'Ativo', color: 'success' },
  inativo: { label: 'Inativo', color: 'error' },
  ferias: { label: 'Férias', color: 'warning' },
};

function FuncionariosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<any>(null);

  const handleEdit = (func: any) => {
    setSelectedFunc(func);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedFunc(null);
    setModalOpen(true);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main', mb: 1 }}>
            Equipe
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie o acesso e permissões dos seus colaboradores.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<Plus size={20} />}
          onClick={handleNew}
          sx={{ px: 3 }}
        >
          Adicionar Membro
        </Button>
      </Box>

      {/* Tabela */}
      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>COLABORADOR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>CARGO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="right">AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_FUNCIONARIOS.map((row) => {
                const RoleIcon = roleMap[row.cargo]?.icon || User;
                return (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" gap={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 'bold' }}>
                          {row.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>{row.nome}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<RoleIcon size={14} />}
                        label={roleMap[row.cargo]?.label}
                        size="small"
                        color={roleMap[row.cargo]?.color as any}
                        variant="outlined"
                        sx={{ fontWeight: 600, border: 'none', bgcolor: `${roleMap[row.cargo]?.color}.light` + '20' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusMap[row.status]?.label}
                        size="small"
                        color={statusMap[row.status]?.color as any}
                        sx={{ height: 24, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(row)} sx={{ mr: 1 }}>
                          <Pencil size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover">
                        <IconButton size="small" color="error">
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal de Adicionar/Editar */}
      <StyledModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFunc ? "Editar Colaborador" : "Novo Colaborador"}
      >
        <FuncionarioModal
          initialData={selectedFunc}
          onClose={() => setModalOpen(false)}
        />
      </StyledModal>
    </Box>
  );
}