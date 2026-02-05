import React from 'react';
import { Box, Paper, Typography, alpha, Stack } from '@mui/material';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    badge?: string;
    details?: string; // NOVO: Para mostrar "1 Mesa, 1 Item"
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    valueColor?: string;
    badgeColor?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export default function MetricCard({
    title,
    value,
    badge,
    details,
    icon: Icon,
    iconColor = 'primary.main',
    bgColor = 'primary.lighter',
    valueColor = 'text.primary',
    badgeColor = 'primary'
}: MetricCardProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)',
                    borderColor: 'transparent'
                }
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={0.5}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color={valueColor}>
                        {value}
                    </Typography>

                    {/* NOVO: Exibição do detalhe logo abaixo do valor */}
                    {details && (
                        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
                            {details}
                        </Typography>
                    )}
                </Box>

                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: bgColor,
                        color: iconColor
                    }}
                >
                    <Icon size={24} />
                </Box>
            </Box>

            {badge && (
                <Box mt="auto">
                    <Stack direction="row" alignItems="center" gap={0.5}>
                        <Typography
                            variant="caption"
                            sx={{
                                bgcolor: alpha(iconColor.startsWith('#') ? iconColor : '#000', 0.1),
                                color: iconColor,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: '0.7rem'
                            }}
                        >
                            {badge}
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}