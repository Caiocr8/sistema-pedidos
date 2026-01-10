import {
    collection, addDoc, updateDoc, doc, serverTimestamp,
    query, where, orderBy, limit, getDocs, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// --- DEFINIÇÃO DAS INTERFACES (EXPORTADAS) ---

export interface CaixaSessao {
    id?: string;
    usuarioId: string;
    usuarioNome: string;
    dataAbertura: any; // Timestamp
    dataFechamento?: any; // Timestamp
    valorInicial: number;
    valorFinal?: number; // Valor em dinheiro físico contado
    saldoFinalTotal?: number; // Soma total (Dinheiro + Cartão) apurada
    status: 'aberto' | 'fechado';
    saldoAtual: number; // Controle de saldo em dinheiro atual (Fundo + Entradas - Saídas)
    resumoFechamento?: {
        esperadoDinheiro: number;
        esperadoCartaoPix: number;
        contadoDinheiro: number;
        contadoCartaoPix: number;
        diferenca: number;
        observacoes: string;
    };
    diferenca?: number; // Mantido para compatibilidade simples
}

export interface Movimentacao {
    id?: string;
    sessaoId: string;
    tipo: 'abertura' | 'venda' | 'sangria' | 'suprimento' | 'fechamento';
    valor: number;
    descricao?: string;
    data: any; // Timestamp
    usuarioId: string;
}

export interface RelatorioData {
    sessao: CaixaSessao;
    vendas: {
        dinheiro: number;
        credito: number;
        debito: number;
        pix: number;
        outros: number;
        total: number;
    };
    saidas: {
        total: number;
        lista: Movimentacao[];
    };
    esperado: {
        dinheiro: number;   // Saldo Inicial + Vendas Dinheiro - Saídas
        cartaoPix: number;  // Vendas Cartão + Pix
        totalGeral: number;
    };
    fechamento?: {
        dinheiroContado: number;
        cartaoPixContado: number;
        totalGeralContado: number;
        diferenca: number;
        observacoes: string;
    }
}

// --- FUNÇÕES DO SERVIÇO ---

// Verifica se o usuário já tem um caixa aberto
export const getCaixaAberto = async (usuarioId: string) => {
    const q = query(
        collection(db, 'caixa_sessoes'),
        where('usuarioId', '==', usuarioId),
        where('status', '==', 'aberto'),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CaixaSessao;
};

// Abre um novo caixa
export const abrirCaixa = async (usuarioId: string, usuarioNome: string, valorInicial: number) => {
    // 1. Criar Sessão
    const sessaoRef = await addDoc(collection(db, 'caixa_sessoes'), {
        usuarioId,
        usuarioNome,
        dataAbertura: serverTimestamp(),
        valorInicial,
        saldoAtual: valorInicial,
        status: 'aberto'
    });

    // 2. Registrar Movimentação de Abertura
    await addDoc(collection(db, 'caixa_movimentacoes'), {
        sessaoId: sessaoRef.id,
        tipo: 'abertura',
        valor: valorInicial,
        descricao: 'Abertura de Caixa',
        data: serverTimestamp(),
        usuarioId
    });

    return sessaoRef.id;
};

// Registra movimentação (Sangria, Suprimento, Venda Dinheiro)
export const registrarMovimentacao = async (
    sessaoId: string,
    usuarioId: string,
    tipo: 'sangria' | 'suprimento' | 'venda' | 'fechamento',
    valor: number,
    descricao: string,
    saldoAtualCaixa: number = 0 // Opcional se for só registro sem atualizar saldo
) => {
    // Sangria subtrai do saldo físico. Suprimento/Venda(Dinheiro) somam.
    // Fechamento não altera saldo operacional, é apenas log.
    let novoSaldo = saldoAtualCaixa;

    if (tipo === 'sangria') novoSaldo -= valor;
    else if (tipo === 'suprimento' || tipo === 'venda') novoSaldo += valor;

    // 1. Registra Movimento
    await addDoc(collection(db, 'caixa_movimentacoes'), {
        sessaoId,
        tipo,
        valor: valor,
        descricao,
        data: serverTimestamp(),
        usuarioId
    });

    // 2. Atualiza Saldo da Sessão (apenas se afetar o caixa físico operacional)
    if (tipo !== 'fechamento') {
        await updateDoc(doc(db, 'caixa_sessoes', sessaoId), {
            saldoAtual: novoSaldo
        });
    }
};

// Busca histórico de sessões
export const subscribeToHistorico = (callback: (data: CaixaSessao[]) => void) => {
    const q = query(
        collection(db, 'caixa_sessoes'),
        orderBy('dataAbertura', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaixaSessao));
        callback(data);
    });
};

// Calcula dados completos para o relatório (Parcial ou Final)
export const getDadosRelatorio = async (sessao: CaixaSessao): Promise<RelatorioData> => {
    // 1. Buscar Movimentações
    const movQuery = query(collection(db, 'caixa_movimentacoes'), where('sessaoId', '==', sessao.id));
    const movSnap = await getDocs(movQuery);
    const movs = movSnap.docs.map(d => d.data() as Movimentacao);

    const saidas = movs.filter(m => m.tipo === 'sangria');
    const totalSaidas = saidas.reduce((acc, m) => acc + m.valor, 0);
    const totalSuprimentos = movs.filter(m => m.tipo === 'suprimento').reduce((acc, m) => acc + m.valor, 0);

    // 2. Buscar Vendas (Pedidos Entregues/Finalizados neste período)
    const endData = sessao.dataFechamento || new Date();

    const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('status', '==', 'entregue'),
        where('createdAt', '>=', sessao.dataAbertura),
        where('createdAt', '<=', endData)
    );

    const pedidosSnap = await getDocs(pedidosQuery);

    const vendas = { dinheiro: 0, credito: 0, debito: 0, pix: 0, outros: 0, total: 0 };

    pedidosSnap.docs.forEach(doc => {
        const p = doc.data();
        const valor = Number(p.total || 0);
        // Garanta que seus pedidos salvam o campo 'metodoPagamento'
        const metodo = p.metodoPagamento || 'dinheiro';

        if (metodo === 'dinheiro') vendas.dinheiro += valor;
        else if (metodo === 'credito') vendas.credito += valor;
        else if (metodo === 'debito') vendas.debito += valor;
        else if (metodo === 'pix') vendas.pix += valor;
        else vendas.outros += valor;

        vendas.total += valor;
    });

    // 3. Calcular Esperados
    // Dinheiro na gaveta deve ser: Troco Inicial + Suprimentos + Vendas Dinheiro - Sangrias
    const dinheiroEsperado = (sessao.valorInicial + totalSuprimentos + vendas.dinheiro) - totalSaidas;
    const cartaoPixEsperado = vendas.credito + vendas.debito + vendas.pix + vendas.outros;

    return {
        sessao,
        vendas,
        saidas: { total: totalSaidas, lista: saidas },
        esperado: {
            dinheiro: dinheiroEsperado,
            cartaoPix: cartaoPixEsperado,
            totalGeral: dinheiroEsperado + cartaoPixEsperado
        }
    };
};

// Fecha o caixa salvando todos os detalhes da conferência
export const fecharCaixaCompleto = async (
    sessaoId: string,
    dadosRelatorio: RelatorioData,
    conferencia: { dinheiro: number, cartaoPix: number, obs: string }
) => {
    const totalContado = conferencia.dinheiro + conferencia.cartaoPix;
    const diferenca = totalContado - dadosRelatorio.esperado.totalGeral;

    // Atualiza a sessão com status fechado e resumo
    await updateDoc(doc(db, 'caixa_sessoes', sessaoId), {
        status: 'fechado',
        dataFechamento: serverTimestamp(),
        valorFinal: conferencia.dinheiro, // Valor físico contado
        saldoFinalTotal: totalContado,    // Valor global apurado
        resumoFechamento: {
            esperadoDinheiro: dadosRelatorio.esperado.dinheiro,
            esperadoCartaoPix: dadosRelatorio.esperado.cartaoPix,
            contadoDinheiro: conferencia.dinheiro,
            contadoCartaoPix: conferencia.cartaoPix,
            diferenca: diferenca,
            observacoes: conferencia.obs
        }
    });

    // Registra movimentação de fechamento apenas para log visual
    await addDoc(collection(db, 'caixa_movimentacoes'), {
        sessaoId,
        tipo: 'fechamento',
        valor: conferencia.dinheiro,
        descricao: `Fechamento de Caixa (Dif: R$ ${diferenca.toFixed(2)})`,
        data: serverTimestamp(),
        usuarioId: 'sistema'
    });
};

// Função simples de fechamento (caso antigo, mantido por compatibilidade se necessário)
export const fecharCaixa = async (sessaoId: string, valorFinalInformado: number, saldoSistema: number) => {
    await updateDoc(doc(db, 'caixa_sessoes', sessaoId), {
        status: 'fechado',
        dataFechamento: serverTimestamp(),
        valorFinal: valorFinalInformado,
        diferenca: valorFinalInformado - saldoSistema
    });
};