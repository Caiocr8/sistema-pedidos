import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// A MUDANÇA ESTÁ AQUI: Importe do novo pacote
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [
        TanStackRouterVite({}),
        tsconfigPaths(),

        react(),
    ],
    define: {
        'process.env': import.meta,
    }
})