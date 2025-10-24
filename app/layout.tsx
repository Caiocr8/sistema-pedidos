import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import MuiProvider from '@/app/providers/mui-provider';
import ThemeToggle from '@/app/components/layout/theme-toggle';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AuthProvider from '@/app/providers/auth-provider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Sistema Pedidos',
  description: 'Gerenciamento de pedidos.',
  openGraph: {
    title: 'Sistema Pedidos',
    description: 'Gerenciamento de pedidos.',
    images: [{ url: '/favicon.ico', width: 800, height: 600, alt: 'Logo do Sistema Pedidos' }],
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <MuiProvider>
          <CssBaseline />
          <AuthProvider>
            <Box
              component="main"
              sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
              }}
            >
              {children}
            </Box>
          </AuthProvider>
          <ThemeToggle />
        </MuiProvider>
      </body>
    </html>
  );
}