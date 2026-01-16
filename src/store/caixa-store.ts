import { create } from 'zustand';
import { db } from '@/lib/api/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface CaixaStore {
    caixaAberto: boolean;
    caixaId: string | null;
    isLoading: boolean;
    checkCaixaStatus: () => Promise<void>;
    setCaixaAberto: (id: string) => void;
    setCaixaFechado: () => void;
}

export const useCaixaStore = create<CaixaStore>((set) => ({
    caixaAberto: false,
    caixaId: null,
    isLoading: true, // Começa carregando

    checkCaixaStatus: async () => {
        set({ isLoading: true });
        try {
            // Busca se existe algum caixa com status 'ABERTO' no Firestore
            const q = query(
                collection(db, 'caixa_sessoes'),
                where('status', '==', 'aberto'),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                set({ caixaAberto: true, caixaId: doc.id });
            } else {
                set({ caixaAberto: false, caixaId: null });
            }
        } catch (error) {
            console.error("Erro ao verificar caixa:", error);
            set({ caixaAberto: false });
        } finally {
            set({ isLoading: false });
        }
    },

    // Funções auxiliares para atualizar o estado localmente após ações do usuário
    setCaixaAberto: (id: string) => set({ caixaAberto: true, caixaId: id }),
    setCaixaFechado: () => set({ caixaAberto: false, caixaId: null }),
}));