import { db } from '@/lib/api/firebase/config';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';

/**
 * Move um pedido da coleção ativa para finalizados.
 */
export const finalizarPedido = async (pedido: any) => {
    const pedidoRef = doc(db, 'pedidos', pedido.docId);
    const historicoRef = doc(db, 'pedidos_finalizados', pedido.docId);

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(pedidoRef);
        if (!docSnap.exists()) throw new Error("Pedido não existe mais!");

        // 1. Copia para a nova coleção com status finalizado
        transaction.set(historicoRef, {
            ...docSnap.data(),
            status: 'entregue',
            finishedAt: serverTimestamp()
        });

        // 2. Remove da coleção atual
        transaction.delete(pedidoRef);
    });
};

/**
 * Move um pedido para cancelados com motivo (Mesa Inteira).
 */
export const cancelarPedido = async (pedido: any, motivo: string) => {
    const pedidoRef = doc(db, 'pedidos', pedido.docId);
    const canceladoRef = doc(db, 'pedidos_cancelados', pedido.docId);

    await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(pedidoRef);
        if (!docSnap.exists()) throw new Error("Pedido não existe mais!");

        // 1. Copia para coleção de cancelados
        transaction.set(canceladoRef, {
            ...docSnap.data(),
            status: 'cancelado',
            motivoCancelamento: motivo,
            cancelledAt: serverTimestamp(),
            cancelledBy: 'usuario_atual'
        });

        // 2. Remove da coleção atual
        transaction.delete(pedidoRef);
    });
};

/**
 * Remove um item específico do pedido e registra o motivo em 'itens_cancelados'
 */
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

        // 1. Cria o registro de auditoria
        transaction.set(cancelamentoRef, {
            pedidoId: pedidoId,
            mesa: dadosAtuais.mesa,
            item: itemRemovido,
            motivo: motivo,
            canceladoEm: serverTimestamp(),
            canceladoPor: usuario,
            valorOriginal: itemRemovido.precoUnitario * itemRemovido.quantidade
        });

        // 2. Remove o item do array e recalcula
        itensAtuais.splice(itemIndex, 1);

        const novoTotal = itensAtuais.reduce((acc: number, curr: any) => {
            return acc + (curr.precoUnitario * curr.quantidade);
        }, 0);

        // 3. Atualiza o pedido original
        transaction.update(pedidoRef, {
            itens: itensAtuais,
            total: novoTotal
        });
    });
};