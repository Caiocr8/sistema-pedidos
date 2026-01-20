import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, FormControlLabel, Checkbox, IconButton, Typography, Stack, Divider, Paper
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/forms/input';
import { CardapioItem } from '@/store/cardapio-store';

interface ProdutoModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (item: Partial<CardapioItem>) => Promise<void>;
    itemParaEditar?: CardapioItem | null;
}

export default function ProdutoModal({ open, onClose, onSave, itemParaEditar }: ProdutoModalProps) {
    const [nome, setNome] = useState('');
    const [preco, setPreco] = useState('');
    const [categoria, setCategoria] = useState('');
    const [descricao, setDescricao] = useState('');
    const [disponivel, setDisponivel] = useState(true);
    const [loading, setLoading] = useState(false);

    // Estado para Adicionais
    const [adicionais, setAdicionais] = useState<{ nome: string; preco: number }[]>([]);
    const [novoAdcNome, setNovoAdcNome] = useState('');
    const [novoAdcPreco, setNovoAdcPreco] = useState('');

    useEffect(() => {
        if (open) {
            if (itemParaEditar) {
                setNome(itemParaEditar.nome);
                setPreco(itemParaEditar.preco.toFixed(2));
                setCategoria(itemParaEditar.categoria);
                setDescricao(itemParaEditar.descricao || '');
                setDisponivel(itemParaEditar.disponivel);
                setAdicionais(itemParaEditar.adicionais || []);
            } else {
                // Reset form
                setNome('');
                setPreco('');
                setCategoria('');
                setDescricao('');
                setDisponivel(true);
                setAdicionais([]);
            }
        }
    }, [open, itemParaEditar]);

    const handleAddAdicional = () => {
        if (!novoAdcNome || !novoAdcPreco) return;
        const precoNum = parseFloat(novoAdcPreco.replace(',', '.'));
        if (isNaN(precoNum)) return;

        setAdicionais(prev => [...prev, { nome: novoAdcNome, preco: precoNum }]);
        setNovoAdcNome('');
        setNovoAdcPreco('');
    };

    const handleRemoveAdicional = (index: number) => {
        setAdicionais(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const precoNum = parseFloat(preco.replace(',', '.'));

            await onSave({
                nome,
                preco: isNaN(precoNum) ? 0 : precoNum,
                categoria,
                descricao,
                disponivel,
                adicionais // Salva a lista de adicionais
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {itemParaEditar ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Input
                        label="Nome do Produto"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        autoFocus
                    />

                    <Box display="flex" gap={2}>
                        <Input
                            label="Preço (R$)"
                            value={preco}
                            onChange={e => setPreco(e.target.value)}
                            type="number"
                            placeholder="0.00"
                        />
                        <Input
                            label="Categoria"
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            placeholder="Ex: Bebidas"
                        />
                    </Box>

                    <Input
                        label="Descrição"
                        value={descricao}
                        onChange={e => setDescricao(e.target.value)}
                        multiline
                        rows={2}
                    />

                    <FormControlLabel
                        control={<Checkbox checked={disponivel} onChange={e => setDisponivel(e.target.checked)} />}
                        label="Disponível para venda"
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* GERENCIADOR DE ADICIONAIS */}
                    <Typography variant="subtitle2" fontWeight="bold">Opções de Adicionais</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Adicione itens extras que o cliente pode escolher (Ex: Gelo, Limão, Bacon Extra).
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box display="flex" gap={1} alignItems="flex-end" mb={2}>
                            <Box flex={1}>
                                <Input
                                    label="Nome do Adicional"
                                    value={novoAdcNome}
                                    onChange={e => setNovoAdcNome(e.target.value)}
                                    placeholder="Ex: Com Gelo"
                                    size="small"
                                />
                            </Box>
                            <Box width={100}>
                                <Input
                                    label="Valor"
                                    value={novoAdcPreco}
                                    onChange={e => setNovoAdcPreco(e.target.value)}
                                    placeholder="0.00"
                                    size="small"
                                    type="number"
                                />
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleAddAdicional}
                                style={{ height: 40 }}
                            >
                                <Plus size={18} />
                            </Button>
                        </Box>

                        <Stack spacing={1}>
                            {adicionais.length === 0 && (
                                <Typography variant="caption" color="text.secondary" align="center">
                                    Nenhum adicional cadastrado.
                                </Typography>
                            )}
                            {adicionais.map((adc, idx) => (
                                <Paper key={idx} sx={{ p: 1, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">{adc.nome}</Typography>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                            + R$ {adc.preco.toFixed(2)}
                                        </Typography>
                                        <IconButton size="small" color="error" onClick={() => handleRemoveAdicional(idx)}>
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>

                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button variant="contained" onClick={handleSubmit} loading={loading}>
                    Salvar Produto
                </Button>
            </DialogActions>
        </Dialog>
    );
}