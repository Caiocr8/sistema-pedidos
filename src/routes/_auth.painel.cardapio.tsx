import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Box, Paper, Stack, IconButton, CircularProgress,
  Alert, Chip
} from '@mui/material';
import { Plus, Edit, Trash2, Tag, Layers } from 'lucide-react';

import { useCardapioStore, CardapioItem } from '@/store/cardapio-store';
import Button from '@/components/ui/button';
// Importe o modal que acabamos de criar
import ProdutoModal from '@/components/layout/cardapio/modals/produto-modal';

export const Route = createFileRoute('/_auth/painel/cardapio')({
  component: CardapioPage,
})

function CardapioPage() {
  const {
    itens, loading, error, dbReady,
    checkDbStatusAndInit, addItem, updateItem, deleteItem, saving
  } = useCardapioStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<CardapioItem | null>(null);

  useEffect(() => {
    checkDbStatusAndInit();
  }, [checkDbStatusAndInit]);

  const itensAgrupados = useMemo(() => {
    return itens.reduce((acc, item) => {
      const cat = item.categoria || 'Sem Categoria';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, CardapioItem[]>);
  }, [itens]);

  const handleOpenModal = (item?: CardapioItem) => {
    setItemParaEditar(item || null);
    setModalOpen(true);
  };

  const handleSave = async (dados: Partial<CardapioItem>) => {
    try {
      if (itemParaEditar) {
        await updateItem(itemParaEditar.id, dados);
      } else {
        await addItem(dados as any);
      }
      setModalOpen(false);
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      try {
        await deleteItem(id);
      } catch (e: any) {
        alert('Erro ao excluir: ' + e.message);
      }
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main' }}>
            Cardápio Digital
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie produtos, preços e adicionais.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
          disabled={!dbReady || loading}
        >
          Novo Produto
        </Button>
      </Stack>

      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!loading && itens.length === 0 && !error && (
        <Alert severity="info">Seu cardápio está vazio. Adicione o primeiro item!</Alert>
      )}

      {!loading && Object.keys(itensAgrupados).sort().map(cat => (
        <Box key={cat} mb={5}>
          <Stack direction="row" alignItems="center" gap={1} mb={2} sx={{ borderBottom: 2, borderColor: 'primary.light', pb: 0.5 }}>
            <Tag size={20} color="#C68642" />
            <Typography variant="h5" fontWeight={600} color="text.primary">
              {cat}
            </Typography>
            <Chip label={itensAgrupados[cat].length} size="small" sx={{ ml: 1, bgcolor: 'background.paper', border: '1px solid #ddd' }} />
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {itensAgrupados[cat].map(item => (
              <Paper
                key={item.id}
                elevation={1}
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  opacity: item.disponivel ? 1 : 0.6,
                  borderLeft: `5px solid ${item.disponivel ? '#2e7d32' : '#bdbdbd'}`,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
                      {item.nome}
                    </Typography>
                    {!item.disponivel && <Chip label="Indisponível" size="small" color="default" sx={{ ml: 1, height: 20 }} />}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: '20px' }}>
                    {item.descricao || 'Sem descrição'}
                  </Typography>

                  <Stack direction="row" alignItems="center" gap={2}>
                    <Typography fontWeight="bold" color="success.main" fontSize="1.1rem">
                      R$ {item.preco.toFixed(2)}
                    </Typography>

                    {/* Indicador se tem adicionais */}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <Chip
                        icon={<Layers size={14} />}
                        label={`${item.adicionais.length} ${item.adicionais.length === 1 ? 'adicional' : 'adicionais'}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ height: 24, fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" alignItems="center">
                  <IconButton
                    onClick={() => handleOpenModal(item)}
                    color="primary"
                    size="small"
                    sx={{ bgcolor: 'action.hover', mr: 1 }}
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(item.id, item.nome)}
                    color="error"
                    size="small"
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}

      <ProdutoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        itemParaEditar={itemParaEditar}
      />
    </Box>
  );
}