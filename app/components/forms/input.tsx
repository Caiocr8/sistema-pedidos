'use client';

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

export interface CustomInputProps extends Omit<TextFieldProps, 'variant'> {
  icon?: React.ReactNode;
  errorText?: string;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: (Number(theme.shape.borderRadius) || 4) * 1.5,
    backgroundColor:
      theme.palette.mode === 'light'
        ? '#FFF9F2'
        : theme.palette.background.paper,
    transition: 'all 0.2s ease-in-out',

    '&:hover fieldset': {
      borderColor: theme.palette.warning.main,
    },

    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.dark,
      borderWidth: 2,
      boxShadow:
        theme.palette.mode === 'light'
          ? `0 0 0 3px ${theme.palette.warning.light}33`
          : `0 0 0 3px ${theme.palette.warning.dark}33`,
    },

    '& input': {
      color: theme.palette.text.primary,
      '&::selection': {
        backgroundColor:
          theme.palette.mode === 'light'
            ? theme.palette.primary.light
            : theme.palette.primary.dark,
        color: theme.palette.getContrastText(theme.palette.primary.main),
      },

      // 🧡 Estilização do autofill (Chrome, Edge, Safari)
      '&:-webkit-autofill': {
        boxShadow: `0 0 0 1000px ${theme.palette.mode === 'light'
          ? '#FFF9F2'
          : theme.palette.background.paper
          } inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
        caretColor: theme.palette.text.primary,
        transition: 'background-color 5000s ease-in-out 0s',
      },
    },
  },

  '& label': {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.primary.dark,
      fontWeight: 600,
    },
  },

  '& .MuiFormHelperText-root': {
    marginLeft: 4,
    fontWeight: 500,
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },

  '& .MuiOutlinedInput-root.Mui-error': {
    '& fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.error.dark,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 3px ${theme.palette.error.main}22`,
    },
  },

  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor:
      theme.palette.mode === 'light'
        ? 'rgba(0, 0, 0, 0.05)'
        : 'rgba(255, 255, 255, 0.05)',
    '& fieldset': {
      borderColor:
        theme.palette.mode === 'light'
          ? 'rgba(0, 0, 0, 0.12)'
          : 'rgba(255, 255, 255, 0.12)',
    },
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
