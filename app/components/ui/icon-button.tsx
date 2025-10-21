// app/components/ui/icon-button.tsx
'use client';

import { IconButton as MuiIconButton, IconButtonProps as MuiIconButtonProps, CircularProgress } from '@mui/material';
import { forwardRef } from 'react';

export interface IconButtonProps extends Omit<MuiIconButtonProps, 'color'> {
    loading?: boolean;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit' | 'default';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ loading = false, disabled, children, color = 'default', sx, ...props }, ref) => {
        return (
            <MuiIconButton
                ref={ref}
                disabled={disabled || loading}
                color={color}
                sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.1)',
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    },
                    ...(color === 'default' && {
                        color: '#8B5E3C',
                        '&:hover': {
                            bgcolor: 'rgba(198, 134, 66, 0.08)',
                        },
                    }),
                    ...sx,
                }}
                {...props}
            >
                {loading ? <CircularProgress size={20} /> : children}
            </MuiIconButton>
        );
    }
);

IconButton.displayName = 'IconButton';

export default IconButton;