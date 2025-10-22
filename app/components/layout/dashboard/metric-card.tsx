// app/components/dashboard/metric-card.tsx
'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    badge?: string;
    icon: LucideIcon;
    iconColor: string;
    bgColor: string;
    valueColor: string;
    badgeColor?: 'success' | 'primary' | 'info' | 'warning' | 'error';
}

export default function MetricCard({
    title,
    value,
    badge,
    icon: Icon,
    iconColor,
    bgColor,
    valueColor,
    badgeColor = 'success',
}: MetricCardProps) {
    return (
        <Card elevation={2}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            {title}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: valueColor, mb: 0.5 }}>
                            {value}
                        </Typography>
                        {badge && (
                            <Chip
                                label={badge}
                                size="small"
                                color={badgeColor}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: bgColor }}>
                        <Icon size={24} color={iconColor} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}