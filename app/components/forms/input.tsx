'use client';

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

// Combina os tipos nativos do MUI + props customizadas
export interface CustomInputProps extends Omit<TextFieldProps, 'variant'> {
  icon?: React.ReactNode;
  errorText?: string;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: (Number(theme.shape.borderRadius) || 4) * 1.5,
    backgroundColor: '#FFF9F2',
    transition: 'all 0.2s ease-in-out',

    '&:hover fieldset': {
      borderColor: '#C68642',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#A36A2F',
      boxShadow: `0 0 0 2px ${theme.palette.warning.light}33`,
    },
  },
  '& label.Mui-focused': {
    color: '#A36A2F',
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 4,
    fontWeight: 500,
  },
}));

const Input: React.FC<CustomInputProps> = ({
  icon,
  errorText,
  InputProps = {},
  ...props
}) => {
  return (
    <StyledTextField
      {...props}
      variant="outlined"
      fullWidth
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">{icon}</InputAdornment>
        ) : undefined,
        ...InputProps,
      }}
      helperText={errorText || props.helperText}
      error={!!errorText || props.error}
    />
  );
};

export default Input;
