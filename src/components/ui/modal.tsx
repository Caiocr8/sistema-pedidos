'use client';

import * as React from 'react';
import Modal from '@mui/material/Modal';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { styled, alpha } from '@mui/material/styles';
import { X } from 'lucide-react';

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    zIndex: -1,
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    backgroundColor: alpha(theme.palette.common.black, 0.5),
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
}));

const ModalContentWrapper = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: (Number(theme.shape.borderRadius) || 4) * 2,
    boxShadow: theme.shadows[24],
    outline: 'none',

    // Layout Flex
    display: 'flex',
    flexDirection: 'column',

    // Altura Dinâmica
    maxHeight: '90vh',

    // RESPONSIVIDADE BASE
    width: '100%',
    maxWidth: '95vw',       // Mobile

    [theme.breakpoints.up('sm')]: {
        width: 'auto',      // Desktop
        minWidth: '500px',
    },

    overflow: 'hidden',
}));

interface StyledModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
}

export default function StyledModal({
    open,
    onClose,
    title,
    children,
    maxWidth = 'md',
}: StyledModalProps) {

    const maxWidthValues = {
        xs: '444px',
        sm: '600px',
        md: '900px',
        lg: '1200px',
        xl: '1536px'
    };

    const finalMaxWidth = (typeof maxWidth === 'string' && maxWidth in maxWidthValues)
        ? maxWidthValues[maxWidth as keyof typeof maxWidthValues]
        : maxWidth;

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-title"
            slots={{ backdrop: StyledBackdrop }}
            closeAfterTransition
        >
            {/* CORREÇÃO AQUI: Usando a sintaxe de objeto responsivo do MUI */}
            <ModalContentWrapper sx={{
                maxWidth: { sm: finalMaxWidth }
            }}>
                {/* Header Fixo */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    flexShrink: 0
                }}>
                    <Typography id="modal-title" variant="h6" fontWeight={700} noWrap>
                        {title}
                    </Typography>
                    <IconButton onClick={onClose} aria-label="fechar" size="small" sx={{ ml: 2 }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                {/* Conteúdo com Scroll */}
                <Box sx={{
                    p: 3,
                    overflowY: 'auto',
                    flexGrow: 1,
                    maxHeight: 'calc(90vh - 70px)',
                }}>
                    {children}
                </Box>
            </ModalContentWrapper>
        </Modal>
    );
}