import { createFileRoute, Link } from '@tanstack/react-router';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock } from 'lucide-react';
import Button from '@/components/ui/button';
import IconButton from '@/components/ui/icon-button';

// 1. Definição da Rota
export const Route = createFileRoute('/ajuda')({
    component: AjudaPage,
})

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
                bgcolor: 'primary.main',
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

function AjudaPage() {
    const theme = useTheme();

    // Configurações de Contato
    const whatsappNumber = '5583993984587';
    const displayPhone = '(83) 99398-4587';
    const emailAddress = 'ccaiocr@gmail.com';
    const whatsappMessage = 'Olá! Preciso de ajuda com o sistema Maria Bonita.';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <Box sx={{ py: 4, px: 2, position: 'relative', width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Botão Voltar (Link para /) */}
            {/* Usamos o Link do TanStack Router envolvendo o IconButton */}
            <Link to="/" style={{ textDecoration: 'none' }}>
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
                            fontFamily: '"Caveat", cursive', // Certifique-se que essa fonte está carregada no globals.css ou index.html
                            color: 'primary.main',
                            fontWeight: 700,
                            mb: 1,
                        }}
                    >
                        Precisa de Ajuda?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'text.secondary',
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
                        bgcolor: 'background.paper',
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
                            color: 'text.primary',
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        Fale Conosco no WhatsApp
                    </Typography>

                    <Typography
                        sx={{
                            color: 'text.secondary',
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
                        bgcolor: 'background.paper',
                        mb: 3,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'text.primary',
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
                            onClick={() => window.open(`tel:+${whatsappNumber}`, '_self')}
                        />
                        <Divider />
                        <ContactItem
                            icon={<Mail size={24} />}
                            title="E-mail"
                            details={emailAddress}
                            onClick={() => window.open(`mailto:${emailAddress}`, '_self')}
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
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ArrowLeft size={20} />}
                            sx={{
                                '&:hover': {
                                    bgcolor: theme.palette.action.hover,
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
                        color: 'text.secondary',
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