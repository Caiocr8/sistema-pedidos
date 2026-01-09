'use client';

import React from 'react';

import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

export interface CustomButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

// Estilização customizada usando theme
const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: theme.shape.borderRadius,
  padding: '10px 24px',
  transition: 'all 0.3s ease',

  // Variant contained
  '&.MuiButton-contained': {
    boxShadow: theme.palette.mode === 'light'
      ? '0 4px 8px rgba(78, 44, 10, 0.15)'
      : '0 4px 8px rgba(255, 255, 255, 0.08)',

    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.palette.mode === 'light'
        ? '0 6px 12px rgba(78, 44, 10, 0.2)'
        : '0 6px 12px rgba(255, 255, 255, 0.12)',
    },
  },

  // Variant outlined
  '&.MuiButton-outlined': {
    borderWidth: '2px',

    '&:hover': {
      borderWidth: '2px',
      transform: 'translateY(-1px)',
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(198, 134, 66, 0.08)'
        : 'rgba(230, 185, 128, 0.08)',
    },
  },

  // Variant text
  '&.MuiButton-text': {
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(198, 134, 66, 0.08)'
        : 'rgba(230, 185, 128, 0.08)',
    },
  },

  // Estado disabled
  '&:disabled': {
    transform: 'none',
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  // Estado loading
  '&.MuiButton-loading': {
    pointerEvents: 'none',
  },
}));

const Button: React.FC<CustomButtonProps> = ({
  children,
  variant = 'contained',
  color = 'primary',
  loading = false,
  loadingText = 'Carregando...',
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  sx,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      color={color}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
      className={loading ? 'MuiButton-loading' : ''}
      sx={sx}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress
            size={20}
            color="inherit"
            sx={{ mr: 1 }}
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
};

// CORREÇÃO: Exportar o componente Button (wrapper) e não apenas o StyledButton
export default Button;