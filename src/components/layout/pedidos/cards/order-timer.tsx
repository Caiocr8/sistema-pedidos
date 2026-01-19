import React, { useState, useEffect } from 'react';
import { Stack, Typography, Chip, useTheme } from '@mui/material';
import { Timer as TimerIcon } from 'lucide-react';

interface OrderTimerProps {
    createdAt: any;
    status: string;
    large?: boolean;
}

export default function OrderTimer({ createdAt, status, large = false }: OrderTimerProps) {
    const theme = useTheme();
    const [timeLabel, setTimeLabel] = useState('0 min');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        if (!createdAt || status === 'entregue' || status === 'cancelado') return;

        const startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);

        const updateTimer = () => {
            const now = new Date();
            const totalSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            let formatted = '';
            if (hours > 0) {
                formatted = `${hours} h ${String(minutes).padStart(2, '0')} min`;
            } else {
                formatted = `${minutes} min`;
            }

            setTimeLabel(formatted);
            if (totalSeconds > 2700) setIsLate(true); // 45 min = atrasado
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    if (status === 'entregue' || status === 'cancelado') {
        return <Chip label="Finalizado" size="small" color="success" variant="outlined" />;
    }

    return (
        <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{
                color: isLate ? 'error.main' : 'text.primary',
                bgcolor: large ? (isLate ? 'error.lighter' : 'action.hover') : 'transparent',
                px: large ? 1.5 : 0,
                py: large ? 0.5 : 0,
                borderRadius: 1
            }}
        >
            <TimerIcon size={large ? 18 : 14} />
            <Typography variant={large ? "h6" : "body2"} fontWeight={700} fontFamily="monospace" sx={{ whiteSpace: 'nowrap' }}>
                {timeLabel}
            </Typography>
        </Stack>
    );
}