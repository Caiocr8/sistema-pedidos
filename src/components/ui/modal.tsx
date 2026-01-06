'use client';

import * as React from 'react';
import Modal from '@mui/material/Modal';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { styled, alpha } from '@mui/material/styles';
import { X } from 'lucide-react';

// --- OTIMIZAÇÃO DE PERFORMANCE ---
// Reduzi o blur para evitar lag na abertura (GPU intensive)
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    zIndex: -1,
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: alpha(theme.palette.common.black, 0.4), // Escureci um pouco mais para contraste
    backdropFilter: 'blur(3px)', // Blur leve para não travar
    WebkitBackdropFilter: 'blur(3px)',
    transition: 'opacity 0.2s ease-in-out !important', // Transição rápida forçada
}));

// --- OTIMIZAÇÃO DE TAMANHO ---
const ModalContentWrapper = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: (theme.shape.borderRadius as number) * 2,
    boxShadow: theme.shadows[24],

    // Layout Flex para permitir header/footer fixos se necessário
    display: 'flex',
    flexDirection: 'column',

    // Responsividade e Tamanho Maior
    width: '95vw', // Ocupa quase toda a largura em mobile
    maxWidth: '1000px', // Limite máximo maior para desktop (antes era pequeno)
    maxHeight: '90vh', // Altura máxima de 90% da tela
    outline: 'none',

    // Padding responsivo
    padding: 0, // Removemos padding do wrapper para controlar internamente
    overflow: 'hidden', // Importante para bordas arredondadas
}));

interface StyledModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

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
            aria-labelledby="modal-title"
            slots={{ backdrop: StyledBackdrop }}
            closeAfterTransition
        >
            <ModalContentWrapper>
                {/* Header Padronizado do Modal */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography id="modal-title" variant="h6" fontWeight={700}>
                        {title}
                    </Typography>
                    <IconButton onClick={onClose} aria-label="fechar" size="small">
                        <X size={20} />
                    </IconButton>
                </Box>

                {/* Conteúdo com Scroll Automático */}
                <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 3 // Padding interno do conteúdo
                }}>
                    {children}
                </Box>
            </ModalContentWrapper>
        </Modal>
    );
}