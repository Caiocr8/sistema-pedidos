import { db } from '@/lib/api/firebase/config';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';

export const finalizarPedido = async (
    pedido: any,
    pagamentos?: Record<string, number>,
    opcoes?: {
        troco?: number;
        desconto?: { tipo: 'porcentagem' | 'valor', valorInput: number, valorCalculado: number };
        totalFinal?: number;
        parcelas?: number; // ADICIONADO
    }
) => {
    const pedidoRef = doc(db, 'pedidos', pedido.docId);
    const historicoRef = doc(db, 'pedidos_finalizados', pedido.docId);

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(pedidoRef);
        if (!docSnap.exists()) throw new Error("Pedido não existe mais!");

        const dadosOriginais = docSnap.data();

        const dadosFinalizados = {
            ...dadosOriginais,
            status: 'entregue',
            finishedAt: serverTimestamp(),
            pagamentos: pagamentos || {},
            valorOriginal: dadosOriginais.total,
            total: opcoes?.totalFinal ?? dadosOriginais.total,
            troco: opcoes?.troco || 0,
            desconto: opcoes?.desconto || null,
            parcelas: opcoes?.parcelas || 1 // Salva as parcelas
        };

        transaction.set(historicoRef, dadosFinalizados);
        transaction.delete(pedidoRef);
    });
};

// ... Mantenha as outras funções (cancelarPedido, cancelarItemIndividual) como estavam ...
export const cancelarPedido = async (pedido: any, motivo: string) => {
    const pedidoRef = doc(db, 'pedidos', pedido.docId);
    const canceladoRef = doc(db, 'pedidos_cancelados', pedido.docId);

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(pedidoRef);
        if (!docSnap.exists()) throw new Error("Pedido não existe mais!");

        transaction.set(canceladoRef, {
            ...docSnap.data(),
            status: 'cancelado',
            motivoCancelamento: motivo,
            cancelledAt: serverTimestamp(),
            cancelledBy: 'usuario_atual'
        });

        transaction.delete(pedidoRef);
    });
};

export const cancelarItemIndividual = async (
    pedidoId: string,
    pedidoData: any,
    itemIndex: number,
    motivo: string,
    usuario: string = 'Garçom/Admin'
) => {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const cancelamentoRef = doc(collection(db, 'itens_cancelados'));

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(pedidoRef);
        if (!docSnap.exists()) throw new Error("Pedido não encontrado.");

        const dadosAtuais = docSnap.data();
        const itensAtuais = dadosAtuais.itens || [];

        if (!itensAtuais[itemIndex]) throw new Error("Item não existe mais.");

        const itemRemovido = itensAtuais[itemIndex];

        transaction.set(cancelamentoRef, {
            pedidoId: pedidoId,
            mesa: dadosAtuais.mesa,
            item: itemRemovido,
            motivo: motivo,
            canceladoEm: serverTimestamp(),
            canceladoPor: usuario,
            valorOriginal: itemRemovido.precoUnitario * itemRemovido.quantidade
        });

        itensAtuais.splice(itemIndex, 1);

        const novoTotal = itensAtuais.reduce((acc: number, curr: any) => {
            return acc + (curr.precoUnitario * curr.quantidade);
        }, 0);

        transaction.update(pedidoRef, {
            itens: itensAtuais,
            total: novoTotal
        });
    });
};