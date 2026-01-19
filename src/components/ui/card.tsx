import React from 'react';
import { Paper, Box, Typography, PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CardProps extends Omit<PaperProps, 'title'> {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    hoverEffect?: boolean;
    noPadding?: boolean;
}

const StyledPaper = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'hoverEffect',
})<CardProps>(({ theme, hoverEffect }) => ({
    borderRadius: (Number(theme.shape.borderRadius) || 4) * 1.5, // Mesmo padrão do Input
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[0], // Flat por padrão
    overflow: 'hidden',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',

    ...(hoverEffect && {
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
        },
    }),
}));

const Card: React.FC<CardProps> = ({
    title,
    subtitle,
    action,
    children,
    hoverEffect,
    noPadding = false,
    ...props
}) => {
    return (
        <StyledPaper elevation={0} hoverEffect={hoverEffect} {...props}>
            {/* Cabeçalho do Card (Opcional) */}
            {(title || action) && (
                <Box
                    sx={{
                        p: 3,
                        pb: children ? 1 : 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box>
                        {title && (
                            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                                {title}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {action && <Box>{action}</Box>}
                </Box>
            )}

            {/* Conteúdo */}
            <Box sx={{ p: noPadding ? 0 : 3, pt: (title || action) && !noPadding ? 0 : undefined }}>
                {children}
            </Box>
        </StyledPaper>
    );
};

export default Card;