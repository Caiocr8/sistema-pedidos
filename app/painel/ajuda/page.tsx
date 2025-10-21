// app/ajuda/page.tsx
'use client';

import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock } from 'lucide-react';
import Button from '@/app/components/ui/button';
import IconButton from '@/app/components/ui/icon-button';
import { useRouter } from 'next/navigation';

export default function AjudaPage() {
    const router = useRouter();

    // Configure seu número de WhatsApp aqui (formato: DDI + DDD + número)
    const whatsappNumber = '5583993984587'; // Exemplo: 55 83 99999-9999
    const whatsappMessage = 'Olá! Preciso de ajuda com o sistema Maria Bonita.';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#FAEBD7',
                py: 4,
                px: 2,
                position: 'relative',
            }}
        >
            {/* Botão Voltar */}
            <IconButton
                onClick={() => router.push('/')}
                aria-label="voltar"
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                }}
            >
                <ArrowLeft size={24} />
            </IconButton>

            <Container maxWidth="md" sx={{ mt: 8 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontFamily: '"Caveat", cursive',
                            color: '#4E2C0A',
                            fontWeight: 700,
                            mb: 1,
                        }}
                    >
                        Precisa de Ajuda?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#8B5E3C',
                            maxWidth: 600,
                            mx: 'auto',
                        }}
                    >
                        Estamos aqui para ajudar você! Entre em contato conosco através dos canais abaixo.
                    </Typography>
                </Box>

                {/* Card Principal - WhatsApp */}
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: '#FFF9F2',
                        mb: 3,
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'inline-flex',
                            p: 2.5,
                            borderRadius: '50%',
                            bgcolor: '#25D366',
                            mb: 2,
                        }}
                    >
                        <MessageCircle size={40} color="#FFF" strokeWidth={2} />
                    </Box>

                    <Typography
                        variant="h5"
                        sx={{
                            color: '#4E2C0A',
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        Fale Conosco no WhatsApp
                    </Typography>

                    <Typography
                        sx={{
                            color: '#8B5E3C',
                            mb: 3,
                        }}
                    >
                        Atendimento rápido e direto! Clique no botão abaixo para iniciar uma conversa.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => window.open(whatsappLink, '_blank')}
                        startIcon={<MessageCircle size={20} />}
                        sx={{
                            bgcolor: '#25D366',
                            color: '#FFF',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: '#1EBE57',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Abrir WhatsApp
                    </Button>
                </Paper>

                {/* Outros Canais */}
                <Paper
                    elevation={4}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: '#FFF9F2',
                        mb: 3,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#4E2C0A',
                            fontWeight: 600,
                            mb: 3,
                        }}
                    >
                        Outros Canais de Atendimento
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Telefone */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: '#C68642',
                                    color: '#FFF',
                                }}
                            >
                                <Phone size={24} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ color: '#4E2C0A', fontWeight: 600 }}
                                >
                                    Telefone
                                </Typography>
                                <Typography sx={{ color: '#8B5E3C' }}>
                                    (83) 99939-84587
                                </Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* E-mail */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: '#C68642',
                                    color: '#FFF',
                                }}
                            >
                                <Mail size={24} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ color: '#4E2C0A', fontWeight: 600 }}
                                >
                                    E-mail
                                </Typography>
                                <Typography sx={{ color: '#8B5E3C' }}>
                                    ccaiocr@gmail.com
                                </Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Horário */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: '#C68642',
                                    color: '#FFF',
                                }}
                            >
                                <Clock size={24} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ color: '#4E2C0A', fontWeight: 600 }}
                                >
                                    Horário de Atendimento
                                </Typography>
                                <Typography sx={{ color: '#8B5E3C' }}>
                                    Segunda a Sexta: 8h às 18h
                                </Typography>
                                <Typography sx={{ color: '#8B5E3C' }}>
                                    Sábado: 8h às 12h
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* FAQ Rápido */}
                <Paper
                    elevation={4}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: '#FFF9F2',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#4E2C0A',
                            fontWeight: 600,
                            mb: 3,
                        }}
                    >
                        Perguntas Frequentes
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#4E2C0A', fontWeight: 600, mb: 0.5 }}
                            >
                                Como faço para acessar o sistema?
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#8B5E3C' }}>
                                Use seu e-mail e senha cadastrados na tela de login. Se esqueceu sua senha, entre em contato conosco.
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#4E2C0A', fontWeight: 600, mb: 0.5 }}
                            >
                                Posso usar em mais de um dispositivo?
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#8B5E3C' }}>
                                Sim! O sistema funciona em computadores, tablets e smartphones através do navegador.
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#4E2C0A', fontWeight: 600, mb: 0.5 }}
                            >
                                Como faço para cadastrar produtos?
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#8B5E3C' }}>
                                Após fazer login, acesse o menu "Produtos" e clique em "Adicionar Novo Produto".
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Botão Voltar (mobile) */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => router.push('/')}
                        startIcon={<ArrowLeft size={20} />}
                        sx={{
                            borderColor: '#C68642',
                            color: '#C68642',
                            '&:hover': {
                                borderColor: '#A36A2F',
                                bgcolor: 'rgba(198,134,66,0.08)',
                            },
                        }}
                    >
                        Voltar para Início
                    </Button>
                </Box>
            </Container>

            {/* Footer */}
            <Typography
                variant="body2"
                sx={{
                    textAlign: 'center',
                    color: '#8B5E3C',
                    mt: 6,
                    pb: 2,
                }}
            >
                &copy; 2025 Maria Bonita &bull; Feito com ❤️ e massa de tapioca
            </Typography>
        </Box>
    );
}