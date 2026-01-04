// app/store/cardapioStore.ts (ou onde estiver)
import { create } from 'zustand';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    // addDoc, // Não usaremos mais addDoc para esta lógica
    setDoc, // Usaremos setDoc
    updateDoc,
    deleteDoc,
    doc,
    Firestore,
    Unsubscribe,
    getDoc, // Usaremos getDoc para verificar existência
    // getDocs, // Não é mais necessário para findDocIdByNumericId
    // where, // Não é mais necessário para findDocIdByNumericId
    // serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// Interface ajustada (docId será String(id))
export interface CardapioItem {
    id: number; // ID numérico interno E base para o ID do documento
    nome: string;
    preco: number;
    categoria: string;
    descricao?: string;
    disponivel: boolean;
    docId: string; // ID do documento Firestore (será String(id))
}

// Tipo para os dados que vêm do Firestore
type FirestoreCardapioData = {
    id?: number;
    nome?: string;
    preco?: number;
    categoria?: string;
    descricao?: string;
    disponivel?: boolean;
    [key: string]: any;
};

// Interface do estado da store
interface CardapioState {
    itens: CardapioItem[];
    loading: boolean;
    error: string | null;
    dbReady: boolean;
    unsubscribe: Unsubscribe | null;
    saving: boolean;
    checkDbStatusAndInit: () => void;
    initListener: () => void;
    detachListener: () => void;
    // addItem agora recebe apenas os dados base, o ID numérico será calculado
    addItem: (itemData: Omit<CardapioItem, 'id' | 'docId'>) => Promise<number | null>; // Retorna o ID numérico usado ou null
    updateItem: (itemId: number, itemData: Partial<Omit<CardapioItem, 'id' | 'docId'>>) => Promise<void>;
    deleteItem: (itemId: number) => Promise<void>;
    // findDocIdByNumericId não é mais necessária para update/delete
}

export const useCardapioStore = create<CardapioState>((set, get) => ({
    // ... (itens, loading, error, dbReady, unsubscribe, saving, checkDbStatusAndInit, detachListener - permanecem iguais) ...
    itens: [],
    loading: true,
    error: null,
    dbReady: false,
    unsubscribe: null,
    saving: false,

    checkDbStatusAndInit: () => {
        if (db && typeof db === 'object' && db.constructor.name === 'Firestore') {
            set({ dbReady: true, error: null });
            console.log('Store: DB instance is valid. Initializing listener.');
            get().initListener();
        } else {
            console.warn('Store: DB instance is not ready yet. Retrying listener init shortly.');
            set({ dbReady: false, error: 'Aguardando conexão...', loading: true });
            setTimeout(() => get().checkDbStatusAndInit(), 1000);
        }
    },

    initListener: () => {
        const { dbReady, unsubscribe } = get();
        if (!dbReady) return;
        if (unsubscribe) {
            set({ loading: false }); // Já está ativo, apenas garante loading false
            return;
        }

        console.log('Store: Initializing Firestore listener for cardapio.');
        set({ loading: true, error: null });

        try {
            const cardapioCollectionRef = collection(db as Firestore, 'cardapio');
            // Ordena pelo campo 'id' numérico para consistência
            const q = query(cardapioCollectionRef, orderBy('id'));

            const unsubscribeFunc = onSnapshot(
                q,
                (querySnapshot) => {
                    const itensData: CardapioItem[] = [];
                    querySnapshot.forEach((docSnapshot) => { // Renomeado para evitar conflito com 'doc' de firebase/firestore
                        const data = docSnapshot.data() as FirestoreCardapioData;
                        const docId = docSnapshot.id; // ID do documento (string)

                        // Validação
                        const numericId = typeof data.id === 'number' && data.id > 0 ? data.id : 0;

                        // Verifica se o ID do documento corresponde ao ID numérico interno (como string)
                        if (String(numericId) !== docId) {
                            console.warn(`Store: Discrepância de ID encontrada! Doc ID: "${docId}", Campo ID: ${numericId}. Verifique o item:`, data);
                            // Você pode decidir pular este item ou tentar usar um dos IDs
                            // Pulando por segurança:
                            // return;
                        }

                        if (numericId > 0) {
                            const item: CardapioItem = {
                                id: numericId,
                                docId: docId, // Armazena o ID do documento (que deve ser String(numericId))
                                nome: typeof data.nome === 'string' && data.nome.trim() !== '' ? data.nome.trim() : 'Nome Inválido',
                                preco: typeof data.preco === 'number' && data.preco >= 0 ? data.preco : 0,
                                categoria: typeof data.categoria === 'string' ? data.categoria.trim() : 'Sem Categoria',
                                descricao: typeof data.descricao === 'string' ? data.descricao.trim() : '',
                                disponivel: typeof data.disponivel === 'boolean' ? data.disponivel : false,
                            };
                            itensData.push(item);
                        } else {
                            console.warn("Store: Item skipped due to invalid or missing numeric ID:", data, "Doc ID:", docId);
                        }
                    });
                    set({ itens: itensData, loading: false, error: null });
                    console.log(`Store: Cardápio data updated with ${itensData.length} items.`);
                },
                (err) => {
                    console.error('Store: Erro no listener do cardápio: ', err);
                    set({ error: 'Não foi possível carregar o cardápio.', loading: false, unsubscribe: null });
                }
            );
            set({ unsubscribe: unsubscribeFunc });
        } catch (err: any) {
            console.error("Store: Erro ao configurar o listener: ", err);
            set({ error: 'Erro ao conectar com o cardápio.', loading: false });
        }
    },

    detachListener: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
            console.log('Store: Detaching Firestore listener.');
            unsubscribe();
            set({ unsubscribe: null });
        }
    },

    // --- MODIFICADO ---
    addItem: async (itemData) => {
        if (!get().dbReady) throw new Error('Banco de dados não conectado.');
        set({ saving: true });
        try {
            const cardapioCollectionRef = collection(db as Firestore, 'cardapio');

            // --- Geração do ID Numérico (NÃO SEGURO CONTRA CONCORRÊNCIA) ---
            const currentItens = get().itens;
            const nextId = currentItens.length > 0 ? Math.max(...currentItens.map(item => item.id)) + 1 : 1;
            console.log(`Store: Tentando usar próximo ID numérico: ${nextId}`);
            // -----------------------------------------------------------------

            const docIdString = String(nextId); // Converte para string para usar como ID do documento
            const itemRef = doc(cardapioCollectionRef, docIdString);

            // Verifica se um documento com este ID já existe (precaução extra)
            const docSnap = await getDoc(itemRef);
            if (docSnap.exists()) {
                // Isso pode acontecer se a lógica Math.max falhar devido a concorrência
                throw new Error(`Erro: Documento com ID ${nextId} já existe. Tente novamente.`);
            }

            // Adiciona o campo 'id' numérico aos dados que serão salvos
            const dataToSave = {
                ...itemData,
                id: nextId, // Garante que o campo 'id' numérico está nos dados
                // createdAt: serverTimestamp(), // Adicionar se desejar
                // updatedAt: serverTimestamp(),
            };

            // Usa setDoc com o ID numérico convertido para string
            await setDoc(itemRef, dataToSave);

            set({ saving: false });
            console.log(`Store: Item adicionado com ID numérico e Doc ID: ${nextId}`);
            return nextId; // Retorna o ID numérico usado
        } catch (error) {
            console.error("Store: Erro ao adicionar item: ", error);
            set({ saving: false, error: `Falha ao adicionar item: ${error instanceof Error ? error.message : String(error)}` });
            throw error;
        }
    },

    // --- MODIFICADO ---
    updateItem: async (itemId, itemData) => {
        if (!get().dbReady) throw new Error('Banco de dados não conectado.');
        if (typeof itemId !== 'number' || itemId <= 0) throw new Error("ID numérico inválido.");
        set({ saving: true });
        try {
            const docIdString = String(itemId); // Converte ID numérico para string
            const itemRef = doc(db as Firestore, 'cardapio', docIdString);

            // Verifica se o documento realmente existe antes de tentar atualizar
            const docSnap = await getDoc(itemRef);
            if (!docSnap.exists()) {
                throw new Error(`Documento com ID ${itemId} não encontrado para atualização.`);
            }

            // const dataToUpdate = { ...itemData, updatedAt: serverTimestamp() };
            await updateDoc(itemRef, itemData);
            set({ saving: false });
            console.log(`Store: Item com ID ${itemId} atualizado.`);
        } catch (error) {
            console.error("Store: Erro ao atualizar item: ", error);
            set({ saving: false, error: `Falha ao atualizar item: ${error instanceof Error ? error.message : String(error)}` });
            throw error;
        }
    },

    // --- MODIFICADO ---
    deleteItem: async (itemId) => {
        if (!get().dbReady) throw new Error('Banco de dados não conectado.');
        if (typeof itemId !== 'number' || itemId <= 0) throw new Error("ID numérico inválido.");
        set({ saving: true });
        try {
            const docIdString = String(itemId); // Converte ID numérico para string
            const itemRef = doc(db as Firestore, 'cardapio', docIdString);

            // Opcional: Verificar se existe antes de deletar
            // const docSnap = await getDoc(itemRef);
            // if (!docSnap.exists()) {
            //    console.warn(`Store: Documento com ID ${itemId} não encontrado para exclusão.`);
            //    set({ saving: false });
            //    return;
            // }

            await deleteDoc(itemRef);
            set({ saving: false });
            console.log(`Store: Item com ID ${itemId} deletado.`);
        } catch (error) {
            console.error("Store: Erro ao deletar item: ", error);
            set({ saving: false, error: `Falha ao deletar item: ${error instanceof Error ? error.message : String(error)}` });
            throw error;
        }
    },
}));

// Remover ou comentar a função auxiliar se não for mais usada em nenhum outro lugar
// findDocIdByNumericId: async (numericId: number): Promise<string | null> => { ... }