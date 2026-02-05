import { db } from '@/lib/api/firebase/config';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp,
    runTransaction,
    query,
    where,
    getDocs,
    increment,
    orderBy,
    getDoc,
    Timestamp
} from 'firebase/firestore';

// Tipos
export interface OrderItem {
    itemId: number;
    nome: string;
    quantidade: number;
    precoUnitario: number;
}

export interface Order {
    id: string;
    mesa: string;
    itens: OrderItem[];
    total: number;
    status: 'pendente' | 'em_preparo' | 'entregue' | 'finalizado' | 'cancelado';
    createdAt: any;
    createdBy?: string;
}

const PEDIDOS_COLLECTION = 'pedidos';

// ============================================================================
//  LEITURA E CRIAÇÃO
// ============================================================================

export const getPedidos = async () => {
    const q = query(collection(db, PEDIDOS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const criarPedido = async (mesa: string, usuarioId: string, usuarioNome: string) => {
    const orderData = {
        mesa,
        status: 'pendente',
        itens: [],
        total: 0,
        createdAt: serverTimestamp(),
        createdBy: usuarioId,
        createdByName: usuarioNome
    };

    const docRef = await addDoc(collection(db, PEDIDOS_COLLECTION), orderData);

    return {
        id: docRef.id,
        ...orderData,
        createdAt: new Date()
    };
};

export const atualizarPedido = async (id: string, itens: OrderItem[], total: number) => {
    const pedidoRef = doc(db, PEDIDOS_COLLECTION, id);
    await updateDoc(pedidoRef, {
        itens,
        total,
        updatedAt: serverTimestamp()
    });
};

// ============================================================================
//  CANCELAMENTO DE ITEM INDIVIDUAL
// ============================================================================


export const cancelarItemIndividual = async (
    pedidoId: string,
    pedidoAtual: any,
    itemIndex: number,
    motivo: string
) => {
    try {
        const pedidoRef = doc(db, 'pedidos', pedidoId);

        // 1. Clona o array de itens para não alterar a referência original
        const novosItens = [...pedidoAtual.itens];
        const itemAlvo = novosItens[itemIndex];

        // 2. Calcula o valor a ser descontado
        const valorDesconto = itemAlvo.precoUnitario * itemAlvo.quantidade;

        // 3. Marca o item como cancelado no objeto (mantém no array)
        novosItens[itemIndex] = {
            ...itemAlvo,
            cancelado: true,             // Flag principal
            motivoCancelamento: motivo,  // Motivo
            canceladoEm: Timestamp.now() // Data
        };

        // 4. Calcula o novo total do pedido (subtrai o valor do item cancelado)
        const novoTotal = Math.max(0, (pedidoAtual.total || 0) - valorDesconto);

        // 5. Atualiza o documento na coleção 'pedidos' existente
        await updateDoc(pedidoRef, {
            itens: novosItens,
            total: novoTotal,
            updatedAt: serverTimestamp()
        });

    } catch (error) {
        console.error("Erro ao cancelar item:", error);
        throw error;
    }
};

// ============================================================================
//  CONEXÃO FINANCEIRA: PEDIDO -> CAIXA (TRANSAÇÃO ATÔMICA MULTI-PAGAMENTO)
// ============================================================================

export const finalizarPedido = async (
    pedidoId: string,
    pagamentos: Record<string, number>, // Ex: { 'Pix': 50, 'Dinheiro': 20 }
    detalhes: {
        troco: number,
        desconto?: any,
        totalFinal: number,
        parcelas?: number
    },
    userId: string,
    userName: string
) => {
    try {
        await runTransaction(db, async (transaction) => {

            // 1. Verificar Pedido
            const pedidoRef = doc(db, PEDIDOS_COLLECTION, pedidoId);
            const pedidoSnap = await transaction.get(pedidoRef);

            if (!pedidoSnap.exists()) {
                throw new Error("Pedido não encontrado ou já finalizado.");
            }

            const pedidoData = pedidoSnap.data();

            // 2. Verificar Caixa Aberto
            const qCaixa = query(
                collection(db, 'caixa_sessoes'),
                where('userId', '==', userId),
                where('fechadoEm', '==', null)
            );

            const sessoesSnap = await getDocs(qCaixa);

            if (sessoesSnap.empty) {
                throw new Error("CAIXA FECHADO! Abra o caixa antes de finalizar vendas.");
            }

            const sessaoDoc = sessoesSnap.docs[0];
            const sessaoRef = sessaoDoc.ref;

            // 3. Calcular totais reais para o caixa
            // Removemos entradas com valor 0 e calculamos o total real que entra no caixa
            const metodosPagamento = Object.entries(pagamentos).filter(([_, val]) => val > 0);

            // O valor total que entra no caixa (descontando troco se foi dinheiro)
            // Nota: No seu frontend você já calcula o valor liquido por método, aqui assumimos que 'pagamentos' é o valor bruto entregue.
            // Ajuste: Se houver troco, subtraímos da entrada de 'Dinheiro' para o registro financeiro ficar correto.
            if (detalhes.troco > 0 && pagamentos['Dinheiro']) {
                pagamentos['Dinheiro'] -= detalhes.troco;
            }

            // 4. Preparar Pedido Finalizado (Histórico)
            const finalizadoRef = doc(collection(db, 'pedidos_finalizados'));
            const dadosFinalizacao = {
                ...pedidoData,
                idOriginal: pedidoId,
                status: 'finalizado',
                finishedAt: serverTimestamp(),
                pagamentos: pagamentos, // Salva o objeto completo
                detalhesFinanceiros: detalhes,
                finalizedBy: userId,
                finalizedByName: userName
            };

            transaction.set(finalizadoRef, dadosFinalizacao);

            // 5. Processar Transações no Caixa (Uma para cada método de pagamento usado)
            // Isso é vital para relatórios precisos (quanto foi Pix, quanto foi Cartão)

            let totalEntradaCaixa = 0;
            const updatesResumo: any = {};

            for (const [metodo, valor] of metodosPagamento) {
                if (valor <= 0) continue;

                // Se teve troco no dinheiro, o valor real que fica no caixa é (Valor - Troco)
                let valorReal = valor;
                if (metodo === 'Dinheiro' && detalhes.troco > 0) {
                    valorReal = valor - detalhes.troco;
                }

                if (valorReal <= 0) continue; // Se o troco foi total, não entra nada

                totalEntradaCaixa += valorReal;

                // Cria registro no extrato
                const transacaoRef = doc(collection(db, 'caixa_transacoes'));
                transaction.set(transacaoRef, {
                    sessaoId: sessaoDoc.id,
                    tipo: 'ENTRADA',
                    categoria: 'VENDA',
                    descricao: `Venda Mesa ${pedidoData.mesa} (${metodo})`,
                    valor: valorReal,
                    metodoPagamento: metodo,
                    pedidoId: finalizadoRef.id,
                    createdAt: serverTimestamp(),
                    createdBy: userId
                });

                // Prepara update do resumo
                if (!updatesResumo[`resumo.${metodo}`]) updatesResumo[`resumo.${metodo}`] = 0;
                updatesResumo[`resumo.${metodo}`] += valorReal;
            }

            // 6. Atualizar Saldo da Sessão do Caixa
            const updatePayload: any = {
                saldoAtual: increment(totalEntradaCaixa),
                totalEntradas: increment(totalEntradaCaixa),
                ultimaAtualizacao: serverTimestamp()
            };

            // Adiciona os incrementos por método
            Object.keys(updatesResumo).forEach(key => {
                updatePayload[key] = increment(updatesResumo[key]);
            });

            transaction.update(sessaoRef, updatePayload);

            // 7. Apagar pedido da tela de ativos
            transaction.delete(pedidoRef);
        });

        return true;

    } catch (error) {
        console.error("Erro Fatal na Transação:", error);
        throw error;
    }
};

// ============================================================================
//  CANCELAMENTO DE MESA INTEIRA
// ============================================================================

export const cancelarPedido = async (id: string, motivo: string, userId: string) => {
    try {
        const pedidoRef = doc(db, PEDIDOS_COLLECTION, id);
        const snapshot = await getDoc(pedidoRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            await addDoc(collection(db, 'pedidos_cancelados'), {
                ...data,
                idOriginal: id,
                status: 'cancelado',
                motivo,
                cancelledAt: serverTimestamp(),
                cancelledBy: userId
            });
            await deleteDoc(pedidoRef);
        }
    } catch (error) {
        console.error("Erro ao cancelar:", error);
        throw error;
    }
};