'use client';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

interface ProductItemProps {
    id?: number;
    rank: number;
    name: string;
    sales: string | number;
    revenue: string | number;
    percentage?: number; // Opcional
    trend?: string; // Opcional
}

export default function ProductItem({ rank, name, sales, revenue, percentage, trend }: ProductItemProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: percentage ? 1 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 700 }}>{rank}</Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{name}</Typography>
                        <Typography variant="caption" color="text.secondary">{sales} • {revenue}</Typography>
                    </Box>
                </Box>
                {trend && <Chip label={trend} size="small" color="success" sx={{ fontWeight: 600 }} />}
            </Box>
            {percentage !== undefined && <LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 1 } }} />}
        </Box>
    );
}