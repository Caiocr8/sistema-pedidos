// app/components/ui/icon-button.tsx
'use client';

import { IconButton as MuiIconButton, IconButtonProps as MuiIconButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { forwardRef } from 'react';

export interface IconButtonProps extends Omit<MuiIconButtonProps, 'color'> {
    loading?: boolean;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit' | 'default';
}

const StyledIconButton = styled(MuiIconButton)(({ theme }) => ({
    transition: 'all 0.3s ease',

    '&:hover': {
        transform: 'scale(1.1)',
    },

    '&:active': {
        transform: 'scale(0.95)',
    },

    '&.MuiIconButton-colorDefault': {
        color: theme.palette.secondary.main,

        '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
                ? 'rgba(198, 134, 66, 0.08)'
                : 'rgba(230, 185, 128, 0.08)',
        },
    },

    '&.MuiIconButton-colorPrimary': {
        color: theme.palette.primary.main,

        '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
                ? 'rgba(198, 134, 66, 0.08)'
                : 'rgba(230, 185, 128, 0.08)',
        },
    },

    '&.MuiIconButton-colorSecondary': {
        color: theme.palette.secondary.main,

        '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
                ? 'rgba(139, 94, 60, 0.08)'
                : 'rgba(209, 167, 123, 0.08)',
        },
    },

    '&:disabled': {
        opacity: 0.6,
        transform: 'none',
    },
}));

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ loading = false, disabled, children, color = 'default', sx, ...props }, ref) => {
        return (
            <StyledIconButton
                ref={ref}
                disabled={disabled || loading}
                color={color}
                sx={sx}
                {...props}
            >
                {loading ? <CircularProgress size={20} color="inherit" /> : children}
            </StyledIconButton>
        );
    }
);

IconButton.displayName = 'IconButton';

export default IconButton;