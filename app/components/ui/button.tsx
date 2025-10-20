'use client';

import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';


export interface CustomButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

// Estilização customizada (opcional)
const StyledButton = styled(MuiButton)(({ theme }) => ({
  textTransform: 'none', // Remove o uppercase automático
  fontWeight: 600,
  borderRadius: theme.shape.borderRadius,
  padding: '10px 24px',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  
  '&:disabled': {
    transform: 'none',
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

export default Button;