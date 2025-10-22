// app/painel/ajuda/page.tsx
'use client';

import { Box, Container, Typography, Paper, Divider, useTheme } from '@mui/material';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock } from 'lucide-react';
import Button from '@/app/components/ui/button';
import IconButton from '@/app/components/ui/icon-button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Componente para um item de contato
interface ContactItemProps {
    icon: React.ReactNode;
    title: string;
    details: string | React.ReactNode;
    onClick?: () => void;
}

const ContactItem = ({ icon, title, details, onClick }: ContactItemProps) => (
    <Box
        sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': onClick ? { opacity: 0.8 } : {},
            transition: 'opacity 0.2s',
        }}
        onClick={onClick}
    >
        <Box
            sx={{
                display: 'flex',
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.main', // Usa token do tema
                color: 'primary.contrastText',
                flexShrink: 0,
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography
                variant="subtitle1"
                sx={{ color: 'text.primary', fontWeight: 600 }}
            >
                {title}
            </Typography>

            <Typography component="div" sx={{ color: 'text.secondary' }}>
                {details}
            </Typography>
        </Box>
    </Box>
);

export default function AjudaPage() {
    const router = useRouter();
    const theme = useTheme();

    // Configurações de Contato
    const whatsappNumber = '5583993984587';
    const displayPhone = '(83) 99398-4587'; // Formato de exibição
    const emailAddress = 'ccaiocr@gmail.com';
    const whatsappMessage = 'Olá! Preciso de ajuda com o sistema Maria Bonita.';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <Box sx={{ py: 4, px: 2, position: 'relative', width: '100%' }}>
            {/* Botão Voltar (Link para /) */}
            <Link href="/" passHref>
                <IconButton
                    aria-label="voltar"
                    sx={{
                        position: 'absolute',
                        top: { xs: 40, sm: 20 },
                        left: { xs: 20, sm: 20 },
                        color: 'text.secondary',
                        zIndex: 10,
                    }}
                >
                    <ArrowLeft size={24} />
                </IconButton>
            </Link>

            <Container maxWidth="md" sx={{ mt: { xs: 8, sm: 4 } }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontFamily: '"Caveat", cursive',
                            color: 'primary.main', // Usa token do tema
                            fontWeight: 700,
                            mb: 1,
                        }}
                    >
                        Precisa de Ajuda?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'text.secondary', // Usa token do tema
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
                        bgcolor: 'background.paper', // Usa token do tema
                        mb: 3,
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'inline-flex',
                            p: 2.5,
                            borderRadius: '50%',
                            bgcolor: '#25D366', // Cor do WhatsApp (pode ser fixo por ser marca externa)
                            mb: 2,
                        }}
                    >
                        <MessageCircle size={40} color="#FFF" strokeWidth={2} />
                    </Box>

                    <Typography
                        variant="h5"
                        sx={{
                            color: 'text.primary', // Usa token do tema
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        Fale Conosco no WhatsApp
                    </Typography>

                    <Typography
                        sx={{
                            color: 'text.secondary', // Usa token do tema
                            mb: 3,
                        }}
                    >
                        Atendimento rápido e direto!
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
                            },
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
                        bgcolor: 'background.paper', // Usa token do tema
                        mb: 3,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'text.primary', // Usa token do tema
                            fontWeight: 600,
                            mb: 3,
                        }}
                    >
                        Outros Canais de Atendimento
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <ContactItem
                            icon={<Phone size={24} />}
                            title="Telefone"
                            details={displayPhone}
                            onClick={() => window.open(`tel:+${whatsappNumber}`)}
                        />
                        <Divider />
                        <ContactItem
                            icon={<Mail size={24} />}
                            title="E-mail"
                            details={emailAddress}
                            onClick={() => window.open(`mailto:${emailAddress}`)}
                        />
                        <Divider />
                        <ContactItem
                            icon={<Clock size={24} />}
                            title="Horário de Atendimento"
                            details={
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Segunda a Sexta: 8h às 18h
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Sábado: 8h às 12h
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>
                </Paper>

                <Paper
                    elevation={4}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        mb: 3,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}
                    >
                        Perguntas Frequentes
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* ... Conteúdo do FAQ ... */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                                Como faço para acessar o sistema?
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Use seu e-mail e senha cadastrados na tela de login. Se esqueceu sua senha, entre em contato conosco.
                            </Typography>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                                Posso usar em mais de um dispositivo?
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Sim! O sistema funciona em computadores, tablets e smartphones através do navegador.
                            </Typography>
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                                Como faço para cadastrar produtos?
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Após fazer login, acesse o menu "Produtos" e clique em "Adicionar Novo Produto".
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Botão Voltar (rodapé) */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Link href="/" passHref>
                        <Button
                            variant="outlined"
                            color="primary" // Usa a cor do tema
                            startIcon={<ArrowLeft size={20} />}
                            sx={{
                                '&:hover': {
                                    bgcolor: theme.palette.action.hover, // Efeito de hover consistente
                                },
                            }}
                        >
                            Voltar para Início
                        </Button>
                    </Link>
                </Box>

                {/* Footer */}
                <Typography
                    variant="body2"
                    sx={{
                        textAlign: 'center',
                        color: 'text.secondary', // Usa token do tema
                        mt: 6,
                        pb: 2,
                    }}
                >
                    &copy; 2025 Maria Bonita &bull; Feito com ❤️ e massa de tapioca
                </Typography>
            </Container>
        </Box>
    );
}