import { create } from 'zustand';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    Firestore,
    Unsubscribe,
    getDoc
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

export interface CardapioItem {
    id: number;
    nome: string;
    preco: number;
    categoria: string;
    descricao?: string;
    disponivel: boolean;
    docId: string;
    adicionais?: { nome: string; preco: number }[]; // Novo campo para adicionais
}

type FirestoreCardapioData = {
    id?: number | string;
    nome?: string;
    preco?: number;
    categoria?: string;
    descricao?: string;
    disponivel?: boolean;
    adicionais?: { nome: string; preco: number }[];
    [key: string]: any;
};

interface CardapioState {
    itens: CardapioItem[];
    loading: boolean;
    error: string | null;
    dbReady: boolean;
    unsubscribe: Unsubscribe | null;
    saving: boolean;
    checkDbStatusAndInit: () => void;
    initListener: () => void;
    stopListener: () => void;
    addItem: (itemData: Omit<CardapioItem, 'id' | 'docId'>) => Promise<number | null>;
    updateItem: (itemId: number, itemData: Partial<Omit<CardapioItem, 'id' | 'docId'>>) => Promise<void>;
    deleteItem: (itemId: number) => Promise<void>;
}

export const useCardapioStore = create<CardapioState>((set, get) => ({
    itens: [],
    loading: true,
    error: null,
    dbReady: false,
    unsubscribe: null,
    saving: false,

    checkDbStatusAndInit: () => {
        if (db && typeof db === 'object') {
            set({ dbReady: true, error: null });
            console.log('Store: DB validado. Iniciando listener...');
            get().initListener();
        } else {
            console.warn('Store: DB ainda não pronto. Tentando novamente...');
            set({ dbReady: false, error: 'Conectando...', loading: true });
            setTimeout(() => get().checkDbStatusAndInit(), 1500);
        }
    },

    initListener: () => {
        const { dbReady, unsubscribe } = get();

        if (!dbReady) {
            get().checkDbStatusAndInit();
            return;
        }

        if (unsubscribe) return;

        console.log('Store: Buscando dados do cardápio...');
        set({ loading: true, error: null });

        try {
            const cardapioCollectionRef = collection(db as Firestore, 'cardapio');
            const q = query(cardapioCollectionRef, orderBy('id'));

            const unsubscribeFunc = onSnapshot(
                q,
                (querySnapshot) => {
                    const itensData: CardapioItem[] = [];
                    querySnapshot.forEach((docSnapshot) => {
                        const data = docSnapshot.data() as FirestoreCardapioData;
                        const docId = docSnapshot.id;

                        let numericId = 0;
                        if (typeof data.id === 'number') numericId = data.id;
                        else if (typeof data.id === 'string') numericId = parseInt(data.id, 10);

                        if (numericId > 0) {
                            itensData.push({
                                id: numericId,
                                docId: docId,
                                nome: data.nome?.trim() || 'Sem Nome',
                                preco: Number(data.preco) || 0,
                                categoria: data.categoria?.trim() || 'Geral',
                                descricao: data.descricao?.trim() || '',
                                disponivel: typeof data.disponivel === 'boolean' ? data.disponivel : true,
                                adicionais: Array.isArray(data.adicionais) ? data.adicionais : []
                            });
                        }
                    });

                    set({ itens: itensData, loading: false, error: null });
                },
                (err) => {
                    console.error('Store: Erro no listener:', err);
                    if (err.message.includes('index')) {
                        set({ error: 'Erro de Índice no Firebase. Verifique o console.', loading: false });
                    } else {
                        set({ error: 'Erro ao carregar cardápio.', loading: false });
                    }
                }
            );
            set({ unsubscribe: unsubscribeFunc });
        } catch (err: any) {
            console.error("Store: Erro fatal ao iniciar:", err);
            set({ error: 'Falha na conexão.', loading: false });
        }
    },

    stopListener: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
            unsubscribe();
            set({ unsubscribe: null, itens: [], dbReady: false });
        }
    },

    addItem: async (itemData) => {
        const { dbReady } = get();
        if (!dbReady) throw new Error('Aguarde a conexão com o banco.');

        set({ saving: true });
        try {
            const cardapioCollectionRef = collection(db as Firestore, 'cardapio');
            const currentItens = get().itens;
            const nextId = currentItens.length > 0 ? Math.max(...currentItens.map(item => item.id)) + 1 : 1;

            const docIdString = String(nextId);
            const itemRef = doc(cardapioCollectionRef, docIdString);

            const docSnap = await getDoc(itemRef);
            if (docSnap.exists()) throw new Error(`Erro: ID ${nextId} duplicado.`);

            const dataToSave = { ...itemData, id: nextId };

            await setDoc(itemRef, dataToSave);
            set({ saving: false });
            return nextId;
        } catch (error: any) {
            set({ saving: false, error: error.message });
            throw error;
        }
    },

    updateItem: async (itemId, itemData) => {
        if (!get().dbReady) throw new Error('Sem conexão.');
        set({ saving: true });
        try {
            const itemRef = doc(db as Firestore, 'cardapio', String(itemId));
            await updateDoc(itemRef, itemData);
            set({ saving: false });
        } catch (error: any) {
            set({ saving: false, error: error.message });
            throw error;
        }
    },

    deleteItem: async (itemId) => {
        if (!get().dbReady) throw new Error('Sem conexão.');
        set({ saving: true });
        try {
            const itemRef = doc(db as Firestore, 'cardapio', String(itemId));
            await deleteDoc(itemRef);
            set({ saving: false });
        } catch (error: any) {
            set({ saving: false, error: error.message });
            throw error;
        }
    },
}));