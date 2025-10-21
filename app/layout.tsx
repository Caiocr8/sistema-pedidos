
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiProvider from '@/app/providers/MuiProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Pedidos",
  description: "Gerenciamento de pedidos.",
  openGraph: {
    title: "Sistema Pedidos",
    description: "Gerenciamento de pedidos.",
    images: [
      {
        url: '@/app/favicon.ico',
        width: 800,
        height: 600,
      }
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
