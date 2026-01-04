// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './globals.css'

// Cria a instância do roteador (Padrão SPA)
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
})

// Tipagem
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

// Renderização
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>,
    )
}