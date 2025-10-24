import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});




const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🔥 Ativa compressão e cache mais agressiva em produção
  compress: true,
  poweredByHeader: false,

  // ⚙️ Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost'], // adicione domínios externos de imagens aqui
  },

  // ⚡ Reduz bundle em produção (útil com MUI e libs grandes)
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    turbo: {
      rules: {}, // desativa turbopack internamente
    },
  },
  // Otimizações recomendadas
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },


  // ✅ Regras extras para build estável
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // mantenha true se ainda estiver ajustando o TS
  },
};


export default withBundleAnalyzer(nextConfig);
