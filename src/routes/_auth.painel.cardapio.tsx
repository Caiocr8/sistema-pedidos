import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Box, Paper, Stack, IconButton, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  InputAdornment, Alert, Divider, Chip
} from '@mui/material';
import { Plus, Edit, Trash2, Tag, DollarSign, AlignLeft } from 'lucide-react';

// Imports da sua aplicação
import { useCardapioStore, CardapioItem } from '@/store/cardapioStore';
import StyledModal from '@/components/ui/modal';
import Input from '@/components/forms/input';
import Button from '@/components/ui/button';

export const Route = createFileRoute('/_auth/painel/cardapio')({
  component: CardapioPage,
})

// Estado do formulário
interface CardapioFormState {
  id?: number; // ID numérico para edição
  nome: string;
  preco: string; // String para facilitar digitação de moeda
  categoria: string;
  descricao: string;
  disponivel: boolean;
}

const initialFormState: CardapioFormState = {
  nome: '',
  preco: '',
  categoria: '',
  descricao: '',
  disponivel: true
};

function CardapioPage() {
  // Acesso à Store
  const {
    itens, loading, error, dbReady,
    checkDbStatusAndInit, addItem, updateItem, deleteItem, saving
  } = useCardapioStore();

  // Estados locais da tela
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(true);
  const [formData, setFormData] = useState<CardapioFormState>(initialFormState);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Inicializa conexão com o banco ao montar a tela
  useEffect(() => {
    checkDbStatusAndInit();
  }, [checkDbStatusAndInit]);

  // Agrupa os itens por categoria para exibição
  const itensAgrupados = useMemo(() => {
    return itens.reduce((acc, item) => {
      const cat = item.categoria || 'Sem Categoria';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, CardapioItem[]>);
  }, [itens]);

  // Abre o modal (limpo para novo item, ou preenchido para editar)
  const handleOpenModal = (item?: CardapioItem) => {
    setModalError(null);
    setNovaCategoria('');

    if (item) {
      setFormData({
        id: item.id,
        nome: item.nome,
        preco: item.preco.toFixed(2).replace('.', ','),
        categoria: item.categoria,
        descricao: item.descricao || '',
        disponivel: item.disponivel
      });
      setIsNewItem(false);
    } else {
      setFormData(initialFormState);
      setIsNewItem(true);
    }
    setModalOpen(true);
  };

  // Salva o item (Adiciona ou Atualiza)
  const handleSave = async () => {
    setModalError(null);

    // Validações simples
    const precoNum = parseFloat(formData.preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum < 0) return setModalError('Preço inválido.');
    if (!formData.nome.trim()) return setModalError('O nome do produto é obrigatório.');

    // Define a categoria final (existente ou nova digitada)
    const categoriaFinal = (formData.categoria === '__NOVA__' ? novaCategoria : formData.categoria).trim();
    if (!categoriaFinal) return setModalError('A categoria é obrigatória.');

    // Objeto pronto para envio (sem ID, pois a store gerencia ou recebe separadamente)
    const itemData = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim(),
      preco: precoNum,
      categoria: categoriaFinal,
      disponivel: formData.disponivel
    };

    try {
      if (isNewItem) {
        await addItem(itemData);
      } else if (formData.id) {
        await updateItem(formData.id, itemData);
      }
      setModalOpen(false);
    } catch (e: any) {
      setModalError(e.message || 'Erro ao salvar item.');
    }
  };

  // Deleta com confirmação simples do navegador
  const handleDelete = async (id: number, nome: string) => {
    // CORREÇÃO AQUI: Sintaxe correta do template literal
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
      {/* Cabeçalho */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'Caveat, cursive', color: 'primary.main' }}>
            Cardápio Digital
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seus produtos, preços e categorias.
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

      {/* Feedback de Estado */}
      {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!loading && itens.length === 0 && !error && (
        <Alert severity="info">Seu cardápio está vazio. Adicione o primeiro item!</Alert>
      )}

      {/* Listagem por Categoria */}
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
                    {!item.disponivel && <Chip label="Indisponível" size="small" color="default" />}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: '20px' }}>
                    {item.descricao || 'Sem descrição'}
                  </Typography>

                  <Typography fontWeight="bold" color="success.main" fontSize="1.1rem">
                    R$ {item.preco.toFixed(2)}
                  </Typography>
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

      {/* Modal de Adicionar/Editar */}
      <StyledModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isNewItem ? 'Novo Produto' : 'Editar Produto'}
      >
        <Stack spacing={3} mt={1}>
          {modalError && <Alert severity="error">{modalError}</Alert>}

          <Input
            label="Nome do Produto"
            value={formData.nome}
            onChange={e => setFormData({ ...formData, nome: e.target.value })}
            fullWidth
            autoFocus
          />

          <Stack direction="row" gap={2}>
            <Input
              label="Preço"
              value={formData.preco}
              onChange={e => setFormData({ ...formData, preco: e.target.value.replace(/[^0-9,.]/g, '') })}
              icon={<DollarSign size={18} />}
              fullWidth
              placeholder="0,00"
            />

            <FormControl fullWidth>
              <InputLabel id="cat-label">Categoria</InputLabel>
              <Select
                labelId="cat-label"
                value={formData.categoria}
                label="Categoria"
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                {Object.keys(itensAgrupados).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                <Divider />
                <MenuItem value="__NOVA__" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  + Nova Categoria
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Campo condicional para Nova Categoria */}
          {formData.categoria === '__NOVA__' && (
            <Input
              label="Nome da Nova Categoria"
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              placeholder="Ex: Bebidas, Sobremesas..."
              fullWidth
            />
          )}

          <Input
            label="Descrição (Opcional)"
            multiline
            rows={3}
            value={formData.descricao}
            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            icon={<AlignLeft size={18} />}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.disponivel}
                onChange={e => setFormData({ ...formData, disponivel: e.target.checked })}
                color="success"
              />
            }
            label={formData.disponivel ? "Produto Disponível" : "Produto Indisponível"}
            sx={{ color: formData.disponivel ? 'text.primary' : 'text.secondary' }}
          />

          <Button
            onClick={handleSave}
            loading={saving}
            fullWidth
            variant="contained"
            size="large"
          >
            {isNewItem ? 'Cadastrar Produto' : 'Salvar Alterações'}
          </Button>
        </Stack>
      </StyledModal>
    </Box>
  );
}