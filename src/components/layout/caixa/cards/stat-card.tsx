import React from 'react';
import { Box, Typography } from '@mui/material';
import { LucideIcon } from 'lucide-react';
import Card from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    subvalue?: string;
    secondaryInfo?: React.ReactNode;
}

export default function StatCard({ title, value, icon: Icon, color, subvalue, secondaryInfo }: StatCardProps) {
    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, color: `${color}.main` }}>
                <Icon size={100} />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="start" mb={2} position="relative">
                <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: `${color}.main` }}>
                        {typeof value === 'number'
                            ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : value}
                    </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main` }}>
                    <Icon size={24} />
                </Box>
            </Box>

            <Box position="relative">
                {subvalue && (
                    <Typography variant="caption" color="text.secondary" display="block">
                        {subvalue}
                    </Typography>
                )}
                {secondaryInfo && <Box mt={1}>{secondaryInfo}</Box>}
            </Box>
        </Card>
    );
}