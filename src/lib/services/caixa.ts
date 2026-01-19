import {
    collection, doc, runTransaction, serverTimestamp,
    query, where, limit, getDocs, onSnapshot, orderBy, Timestamp,
    Transaction
} from 'firebase/firestore';
import { db } from '@/lib/api/firebase/config';

// --- INTERFACES ---

export interface CaixaSessao {
    id?: string;
    usuarioId: string;
    usuarioNome: string;
    dataAbertura: Timestamp;
    dataFechamento?: Timestamp;
    valorInicial: number;
    valorFinal?: number; // Adicionado para exibição no histórico
    saldoAtual: number;
    status: 'aberto' | 'fechado';
    resumoFechamento?: any;
}

export interface Movimentacao {
    id?: string;
    sessaoId: string;
    tipo: 'abertura' | 'venda' | 'sangria' | 'suprimento' | 'fechamento' | 'sistema';
    formaPagamento?: string;
    valor: number;
    valorRecebido?: number;
    troco?: number;
    descricao?: string;
    pedidoId?: string;
    data: any;
    usuarioId: string;
}

export interface ItemResumo {
    nome: string;
    quantidade: number;
    total: number;
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
        dinheiro: number;
        cartaoPix: number;
        totalGeral: number;
    };
    itensVendidos: ItemResumo[];
    // ADICIONADO: Campo opcional para transitar dados no frontend antes de salvar
    fechamento?: {
        dinheiroContado: number;
        cartaoPixContado: number;
        totalGeralContado: number;
        diferenca: number;
        observacoes: string;
    };
}

// --- SERVIÇO BLINDADO (TRANSACTIONS) ---

export const atualizarOperador = async (sessaoId: string, novoNome: string, usuarioId: string) => {
    const caixaRef = doc(db, 'caixa_sessoes', sessaoId);
    const movRef = doc(collection(db, 'caixa_movimentacoes'));

    await runTransaction(db, async (transaction) => {
        // Atualiza o nome na sessão
        transaction.update(caixaRef, { usuarioNome: novoNome });

        // Registra o evento no histórico de movimentações para segurança
        transaction.set(movRef, {
            sessaoId,
            tipo: 'sistema', // Tipo neutro
            valor: 0,
            descricao: `Troca de Operador para: ${novoNome}`,
            data: serverTimestamp(),
            usuarioId
        });
    });
};


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

export const abrirCaixa = async (usuarioId: string, usuarioNome: string, valorInicial: number) => {
    try {
        const sessaoRef = doc(collection(db, 'caixa_sessoes'));
        const movRef = doc(collection(db, 'caixa_movimentacoes'));
        await runTransaction(db, async (transaction) => {
            const q = query(collection(db, 'caixa_sessoes'), where('usuarioId', '==', usuarioId), where('status', '==', 'aberto'));
            const check = await getDocs(q);
            if (!check.empty) throw new Error("Já existe caixa aberto.");
            transaction.set(sessaoRef, { usuarioId, usuarioNome, dataAbertura: serverTimestamp(), valorInicial, saldoAtual: valorInicial, status: 'aberto' });
            transaction.set(movRef, { sessaoId: sessaoRef.id, tipo: 'abertura', valor: valorInicial, descricao: 'Abertura', data: serverTimestamp(), usuarioId });
        });
        return sessaoRef.id;
    } catch (error) { throw error; }
}

export const processarVenda = async (
    sessaoId: string,
    pedidoId: string,
    totalVenda: number,
    pagamentos: Record<string, number>,
    troco: number,
    desconto: number,
    usuarioId: string
) => {
    const caixaRef = doc(db, 'caixa_sessoes', sessaoId);
    const pedidoRef = doc(db, 'pedidos', pedidoId);

    await runTransaction(db, async (transaction) => {
        const caixaDoc = await transaction.get(caixaRef);
        if (!caixaDoc.exists()) throw new Error("Caixa não encontrado!");

        const dadosCaixa = caixaDoc.data();
        if (dadosCaixa.status !== 'aberto') throw new Error("O caixa foi fechado durante a operação!");

        let saldoFisicoAtual = dadosCaixa.saldoAtual;

        const entradas = Object.entries(pagamentos).filter(([_, valor]) => valor > 0);

        for (const [metodo, valorBruto] of entradas) {
            const isDinheiro = metodo === 'Dinheiro';
            const valorLiquido = isDinheiro ? (valorBruto - troco) : valorBruto;

            if (isDinheiro) {
                saldoFisicoAtual += valorLiquido;
            }

            const movRef = doc(collection(db, 'caixa_movimentacoes'));

            transaction.set(movRef, {
                sessaoId,
                tipo: 'venda',
                formaPagamento: metodo,
                valor: valorLiquido,
                valorRecebido: valorBruto,
                troco: isDinheiro ? troco : 0,
                descricao: `Venda Pedido #${pedidoId.slice(-4).toUpperCase()} (${metodo})`,
                pedidoId,
                data: serverTimestamp(),
                usuarioId
            });
        }

        transaction.update(caixaRef, { saldoAtual: saldoFisicoAtual });

        transaction.update(pedidoRef, {
            status: 'entregue',
            pagamento: {
                status: 'pago',
                pagamentos,
                total: totalVenda,
                troco,
                desconto,
                data: serverTimestamp()
            }
        });
    });
};

export const registrarMovimentacaoManual = async (
    sessaoId: string,
    usuarioId: string,
    tipo: 'sangria' | 'suprimento',
    valor: number,
    descricao: string
) => {
    const caixaRef = doc(db, 'caixa_sessoes', sessaoId);
    const movRef = doc(collection(db, 'caixa_movimentacoes'));

    await runTransaction(db, async (transaction) => {
        const caixaDoc = await transaction.get(caixaRef);
        if (!caixaDoc.exists()) throw new Error("Caixa não encontrado.");

        const atual = caixaDoc.data().saldoAtual;
        let novoSaldo = atual;

        if (tipo === 'sangria') {
            if (atual < valor) throw new Error("Saldo insuficiente para sangria.");
            novoSaldo -= valor;
        } else {
            novoSaldo += valor;
        }

        transaction.set(movRef, {
            sessaoId,
            tipo,
            valor,
            descricao,
            data: serverTimestamp(),
            usuarioId
        });

        transaction.update(caixaRef, { saldoAtual: novoSaldo });
    });
};

// --- FUNÇÕES DE LEITURA E RELATÓRIO ---

// RESTAURADA: Função para listar histórico de caixas
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

export const getDadosRelatorio = async (sessao: CaixaSessao): Promise<RelatorioData> => {
    // 1. Busca Movimentações Financeiras
    const movQuery = query(
        collection(db, 'caixa_movimentacoes'),
        where('sessaoId', '==', sessao.id)
    );
    const movSnap = await getDocs(movQuery);
    const movs = movSnap.docs.map(d => d.data() as Movimentacao);

    const vendas = { dinheiro: 0, credito: 0, debito: 0, pix: 0, outros: 0, total: 0 };
    let totalSuprimentos = 0;
    const saidasLista: Movimentacao[] = [];
    let totalSaidas = 0;

    movs.forEach(m => {
        const valor = Number(m.valor || 0);
        if (m.tipo === 'venda') {
            vendas.total += valor;
            switch (m.formaPagamento) {
                case 'Dinheiro': vendas.dinheiro += valor; break;
                case 'Cartão Crédito': vendas.credito += valor; break;
                case 'Cartão Débito': vendas.debito += valor; break;
                case 'Pix': vendas.pix += valor; break;
                default: vendas.outros += valor; break;
            }
        } else if (m.tipo === 'sangria') {
            saidasLista.push(m);
            totalSaidas += valor;
        } else if (m.tipo === 'suprimento') {
            totalSuprimentos += valor;
        }
    });

    const dinheiroEsperado = (sessao.valorInicial || 0) + vendas.dinheiro + totalSuprimentos - totalSaidas;
    const cartaoPixEsperado = vendas.credito + vendas.debito + vendas.pix + vendas.outros;

    // =========================================================================
    // 2. BUSCA DETALHADA DE ITENS VENDIDOS (QUERY NOS PEDIDOS)
    // =========================================================================

    // Define o intervalo de tempo da sessão
    const dataInicio = sessao.dataAbertura;
    const dataFim = sessao.dataFechamento || Timestamp.now();

    // Busca pedidos entregues neste intervalo
    const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('status', '==', 'entregue'),
        where('createdAt', '>=', dataInicio),
        where('createdAt', '<=', dataFim)
    );

    const pedidosSnap = await getDocs(pedidosQuery);
    const mapaItens: Record<string, ItemResumo> = {};

    pedidosSnap.forEach(doc => {
        const pedido = doc.data();
        if (pedido.itens && Array.isArray(pedido.itens)) {
            pedido.itens.forEach((item: any) => {
                const nome = item.nome || 'Item desconhecido';
                const qtd = Number(item.quantidade || 1);
                const preco = Number(item.precoUnitario || 0);

                if (!mapaItens[nome]) {
                    mapaItens[nome] = { nome, quantidade: 0, total: 0 };
                }

                mapaItens[nome].quantidade += qtd;
                mapaItens[nome].total += (preco * qtd);
            });
        }
    });

    // Converte o mapa em array ordenado por quantidade
    const itensVendidos = Object.values(mapaItens).sort((a, b) => b.quantidade - a.quantidade);

    return {
        sessao,
        vendas,
        saidas: { total: totalSaidas, lista: saidasLista },
        esperado: {
            dinheiro: dinheiroEsperado,
            cartaoPix: cartaoPixEsperado,
            totalGeral: dinheiroEsperado + cartaoPixEsperado
        },
        itensVendidos // <--- Retorna a lista detalhada
    };
};

export const fecharCaixa = async (
    sessaoId: string,
    conferencia: { dinheiro: number, cartao: number, pix: number, obs: string },
    relatorioSistema: any
) => {
    const caixaRef = doc(db, 'caixa_sessoes', sessaoId);
    const movRef = doc(collection(db, 'caixa_movimentacoes'));

    await runTransaction(db, async (transaction) => {
        const diferenca = conferencia.dinheiro - relatorioSistema.esperado.dinheiro;
        const totalConferido = conferencia.dinheiro + conferencia.cartao + conferencia.pix;

        transaction.update(caixaRef, {
            status: 'fechado',
            dataFechamento: serverTimestamp(),
            valorFinal: totalConferido,
            resumoFechamento: {
                ...conferencia,
                diferenca,
                sistema: relatorioSistema.esperado
            }
        });

        transaction.set(movRef, {
            sessaoId,
            tipo: 'fechamento',
            valor: conferencia.dinheiro,
            descricao: `Fechamento (Dif: R$ ${diferenca.toFixed(2)})`,
            data: serverTimestamp(),
            usuarioId: 'sistema'
        });
    });
};