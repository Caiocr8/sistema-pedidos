'use client';

import * as React from 'react';
import Modal from '@mui/material/Modal';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { styled, alpha } from '@mui/material/styles';
import { X } from 'lucide-react'; // Ícone 'X' para fechar

// --- Estilização do Backdrop (Fundo) ---
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    zIndex: -1, // Garante que o backdrop fique atrás do modal
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: alpha(theme.palette.common.black, 0.3),
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)', // Para compatibilidade com Safari
}));

// --- Estilização do Box Central (O "Papel" do Modal) ---
const ModalContentWrapper = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',

    // Estilos do container
    backgroundColor: theme.palette.background.paper,
    borderRadius: (theme.shape.borderRadius as number) * 2,
    boxShadow: theme.shadows[24],

    // --- CORREÇÃO DE RESPONSIVIDADE (PADDING) ---
    padding: theme.spacing(2), // Padding base (16px) para mobile (xs)
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4), // Padding maior (32px) para desktop (sm+)
    },
    // --- FIM DA CORREÇÃO ---

    // Limites de tamanho
    minWidth: '300px',
    width: 'auto',
    maxWidth: '90vw', // Largura máxima é 90% da tela
    maxHeight: '90vh', // Altura máxima é 90% da tela
    overflowY: 'auto', // Adiciona scroll se o conteúdo for muito grande
    outline: 'none',
}));

// --- Props do Componente ---
interface StyledModalProps {
    /** Controla se o modal está aberto ou fechado */
    open: boolean;
    /** Função chamada ao fechar (clique no fundo ou no 'X') */
    onClose: () => void;
    /** Título opcional para o modal */
    title?: string;
    /** O conteúdo que vai aparecer dentro do modal */
    children: React.ReactNode;
}

/**
 * Um componente de Modal estilizado, centralizado,
 * com fundo de blur e botão para fechar.
 */
export default function StyledModal({
    open,
    onClose,
    title,
    children,
}: StyledModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="styled-modal-title"
            aria-describedby="styled-modal-description"
            // Usa o nosso backdrop customizado
            slots={{ backdrop: StyledBackdrop }}
            // Mantém o conteúdo montado para animações de saída
            keepMounted
        >
            <ModalContentWrapper>
                {/* Botão de Fechar no canto superior direito */}
                <IconButton
                    aria-label="fechar modal"
                    onClick={onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        color: theme.palette.grey[500],

                        // --- CORREÇÃO DE RESPONSIVIDADE (POSIÇÃO DO BOTÃO) ---
                        top: theme.spacing(1), // Posição (1) para mobile (xs)
                        right: theme.spacing(1), // Posição (1) para mobile (xs)
                        [theme.breakpoints.up('sm')]: {
                            top: theme.spacing(2), // Posição (2) para desktop (sm+)
                            right: theme.spacing(2), // Posição (2) para desktop (sm+)
                        },
                        // --- FIM DA CORREÇÃO ---
                    })}
                >
                    <X size={24} />
                </IconButton>

                {/* Título (se existir) */}
                {title && (
                    <Typography
                        id="styled-modal-title"
                        variant="h6"
                        component="h2"
                        // Garante que o título não cole no botão 'X'
                        sx={{ pr: 4 }}
                    >
                        {title}
                    </Typography>
                )}

                {/* Conteúdo (Children) */}
                <Box id="styled-modal-description" sx={{ mt: title ? 2 : 0 }}>
                    {children}
                </Box>
            </ModalContentWrapper>
        </Modal>
    );
}

