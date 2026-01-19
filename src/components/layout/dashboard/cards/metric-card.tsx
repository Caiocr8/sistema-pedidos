'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/card';

interface MetricCardProps {
    title: string;
    value: string | number;
    badge?: string;
    icon: LucideIcon;
    iconColor: string;
    bgColor: string;
    valueColor: string;
    badgeColor?: 'success' | 'primary' | 'info' | 'warning' | 'error';
    onClick?: () => void;
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
    onClick
}: MetricCardProps) {
    return (
        <Card
            hoverEffect={!!onClick}
            onClick={onClick}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: valueColor, mb: 0.5, lineHeight: 1 }}>
                        {value}
                    </Typography>
                    {badge && (
                        <Chip
                            label={badge}
                            size="small"
                            color={badgeColor}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, mt: 1 }}
                        />
                    )}
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={iconColor} />
                </Box>
            </Box>
        </Card>
    );
}