import { RelatorioData } from "@/lib/services/caixa";

// CONFIGURAÇÃO DA LARGURA (42 colunas para impressoras 80mm padrão)
const COL_WIDTH = 42;

// --- UTILITÁRIOS DE FORMATAÇÃO ---
const m = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const line = (char = '-', length = COL_WIDTH) => char.repeat(length);

const center = (text: string, length = COL_WIDTH) => {
    const t = text.substring(0, length);
    const spaces = Math.max(0, length - t.length);
    const padLeft = Math.floor(spaces / 2);
    return ' '.repeat(padLeft) + t;
};

const row = (label: string, value: string, char = '.', length = COL_WIDTH) => {
    const valStr = value;
    const maxLabelLen = length - valStr.length - 2;
    const labStr = label.substring(0, maxLabelLen);
    const dots = Math.max(0, length - labStr.length - valStr.length - 1);
    return `${labStr} ${char.repeat(dots)} ${valStr}`;
};

const fmtTime = (dateObj: any) => {
    if (!dateObj) return '--:--';
    // Suporta tanto Timestamp do Firebase quanto Date nativo
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// --- GERAÇÃO DO RECIBO DE PEDIDO (VIA CLIENTE/COZINHA) ---
export const gerarViasRecibo = (
    pedido: any,
    pagamentos: Record<string, number>,
    troco: number,
    docCliente: string,
    tipoDoc: string,
    desconto?: { valorCalculado: number },
    parcelas?: number
) => {
    const gerarCorpo = () => {
        let txt = '';
        txt += `DATA: ${new Date().toLocaleDateString('pt-BR')}  HORA: ${new Date().toLocaleTimeString('pt-BR')}\n`;
        txt += `PEDIDO: #${pedido.docId ? pedido.docId.slice(0, 4).toUpperCase() : '----'}   MESA: ${String(pedido.mesa || '--').padEnd(4)}\n`;

        if (docCliente && docCliente.trim().length > 0) {
            txt += `${tipoDoc}: ${docCliente}\n`;
        }

        txt += `${line()}\n`;
        txt += `ITEM                     QTD      TOTAL\n`;
        txt += `${line()}\n`;

        if (pedido.itens) {
            pedido.itens.forEach((item: any) => {
                const totalItem = item.precoUnitario * item.quantidade;
                txt += `${item.nome.substring(0, COL_WIDTH)}\n`;
                const qtdPreco = `${item.quantidade}x ${m(item.precoUnitario)}`;
                const totalStr = m(totalItem);
                txt += row(qtdPreco, totalStr, ' ', COL_WIDTH) + '\n';
            });
        }

        txt += `${line()}\n`;

        const valorOriginal = pedido.valorOriginal || pedido.total;
        const valorDesconto = desconto?.valorCalculado || 0;
        const totalFinal = valorOriginal - valorDesconto;

        if (valorDesconto > 0) {
            txt += `${row('SUBTOTAL', m(valorOriginal))}\n`;
            txt += `${row('DESCONTO', `-${m(valorDesconto)}`)}\n`;
        }

        txt += `${row('TOTAL A PAGAR', m(totalFinal), ' ')}\n`;
        return txt;
    };

    const gerarPagamentos = () => {
        let txt = '';
        txt += `${line()}\n`;
        txt += `PAGAMENTOS\n`;
        Object.entries(pagamentos).forEach(([metodo, valor]) => {
            if (valor > 0) {
                let label = metodo;
                if (metodo === 'Cartão Crédito' && parcelas && parcelas > 1) label += ` (${parcelas}x)`;
                txt += `${row(label, m(valor))}\n`;
            }
        });
        if (troco > 0) txt += `${row('TROCO', m(troco))}\n`;
        return txt;
    };

    const viaCliente = () => {
        let txt = '';
        txt += `${center('MARIA BONITA')}\n`;
        txt += `${center('RECIBO DO CLIENTE')}\n`;
        txt += `${line('=')}\n`;
        txt += gerarCorpo();
        txt += gerarPagamentos();
        txt += `\n${center('Obrigado pela preferencia!')}\n\n.`;
        return txt;
    };

    const viaEstabelecimento = () => {
        let txt = '';
        txt += `${center('VIA INTERNA')}\n`;
        txt += `${line('=')}\n`;
        txt += gerarCorpo();
        txt += gerarPagamentos();
        txt += `\n\n\n${center('_'.repeat(30))}\n${center('Assinatura')}\n\n.`;
        return txt;
    };

    return { viaCliente: viaCliente(), viaEstabelecimento: viaEstabelecimento() };
};

// --- GERAÇÃO DO RELATÓRIO DE CAIXA (PARCIAL E FECHAMENTO) ---
export const gerarCupomTexto = (dados: RelatorioData, tipo: 'PARCIAL' | 'FECHAMENTO', operador: string) => {
    const { sessao, vendas, itensVendidos } = dados;

    let listaMovimentos: any[] = [];
    if ((dados as any).movimentacoes && Array.isArray((dados as any).movimentacoes)) {
        listaMovimentos = (dados as any).movimentacoes;
    } else if ((dados as any).movimentacoes?.lista) {
        listaMovimentos = (dados as any).movimentacoes.lista;
    } else {
        const listaEntradas = (dados as any).entradas?.lista || [];
        const listaSaidas = (dados as any).saidas?.lista || [];
        listaMovimentos = [...listaEntradas, ...listaSaidas];
    }

    const suprimentosLista = listaMovimentos.filter(x => x.tipo === 'suprimento');
    const sangriasLista = listaMovimentos.filter(x => x.tipo === 'sangria');

    const totalSuprimentos = suprimentosLista.reduce((acc, curr) => acc + curr.valor, 0);
    const totalSangrias = sangriasLista.reduce((acc, curr) => acc + curr.valor, 0);

    let txt = '';
    txt += `${center('MARIA BONITA')}\n`;
    txt += `${center(tipo === 'FECHAMENTO' ? 'FECHAMENTO DE CAIXA' : 'RELATORIO PARCIAL')}\n`;
    txt += `${line('=')}\n`;

    const abertura = sessao.dataAbertura?.toDate ? sessao.dataAbertura.toDate() : new Date();
    const fechamento = sessao.dataFechamento?.toDate ? sessao.dataFechamento.toDate() : new Date();

    txt += `OPERADOR: ${operador.toUpperCase().substring(0, 30)}\n`;
    txt += `ABERTURA: ${abertura.toLocaleString('pt-BR')}\n`;
    if (tipo === 'FECHAMENTO') {
        txt += `FECHAM. : ${fechamento.toLocaleString('pt-BR')}\n`;
    } else {
        txt += `EMISSAO : ${new Date().toLocaleString('pt-BR')}\n`;
    }
    txt += `${line('=')}\n\n`;

    if (suprimentosLista.length > 0) {
        txt += `>>> ENTRADAS (SUPRIMENTOS)\n`;
        suprimentosLista.forEach(s => {
            const hora = fmtTime(s.data);
            const desc = (s.descricao || 'Suprimento').substring(0, 20);
            txt += `${hora} ${desc.padEnd(20)} ${m(s.valor).padStart(8)}\n`;
        });
        txt += `${row('TOTAL ENTRADAS', m(totalSuprimentos), ' ')}\n`;
        txt += `${line()}\n`;
    }

    if (sangriasLista.length > 0) {
        txt += `<<< SAIDAS (SANGRIAS)\n`;
        sangriasLista.forEach(s => {
            const hora = fmtTime(s.data);
            const desc = (s.descricao || 'Sangria').substring(0, 20);
            txt += `${hora} ${desc.padEnd(20)} ${m(s.valor).padStart(8)}\n`;
        });
        txt += `${row('TOTAL SAIDAS', m(totalSangrias), ' ')}\n`;
        txt += `${line()}\n`;
    }

    txt += `\n${center('VENDAS (SISTEMA)')}\n`;
    txt += `${line('-')}\n`;
    txt += `${row('Dinheiro', m(vendas.dinheiro))}\n`;
    txt += `${row('Pix', m(vendas.pix))}\n`;
    txt += `${row('Cartao Credito', m(vendas.credito))}\n`;
    txt += `${row('Cartao Debito', m(vendas.debito))}\n`;
    if (vendas.outros > 0) txt += `${row('Outros', m(vendas.outros))}\n`;
    txt += `${line()}\n`;
    txt += `${row('TOTAL VENDIDO', m(vendas.total), ' ')}\n\n`;

    txt += `${center('CONFERENCIA GAVETA (DINHEIRO)')}\n`;
    txt += `${line('-')}\n`;
    txt += `${row('(+) Saldo Inicial', m(sessao.valorInicial))}\n`;
    txt += `${row('(+) Vendas Dinheiro', m(vendas.dinheiro))}\n`;

    if (totalSuprimentos > 0) txt += `${row('(+) Suprimentos', m(totalSuprimentos))}\n`;
    if (totalSangrias > 0) txt += `${row('(-) Sangrias', m(totalSangrias))}\n`;

    txt += `${line()}\n`;
    const esperadoCalculado = (sessao.valorInicial || 0) + vendas.dinheiro + totalSuprimentos - totalSangrias;
    txt += `${row('(=) ESPERADO NA GAVETA', m(esperadoCalculado), ' ')}\n`;

    if (tipo === 'FECHAMENTO' && dados.fechamento) {
        txt += `${row('(=) CONTADO NA GAVETA', m(dados.fechamento.dinheiroContado), ' ')}\n`;
        txt += `${line()}\n`;
        const dif = dados.fechamento.dinheiroContado - esperadoCalculado;
        const labelDif = Math.abs(dif) < 0.01 ? 'DIFERENCA' : (dif > 0 ? 'SOBRA (+)' : 'FALTA (-)');
        txt += `${row(labelDif, m(Math.abs(dif)), ' ')}\n`;
        if (dados.fechamento.observacoes) txt += `\nOBS: ${dados.fechamento.observacoes}\n`;
    } else {
        txt += `\n*** CONFERENCIA PARCIAL ***\n`;
    }

    if (itensVendidos && itensVendidos.length > 0) {
        txt += `\n${line('=')}\n`;
        txt += `${center('PRODUTOS VENDIDOS')}\n`;
        txt += `${line('-')}\n`;
        txt += "QTD   PRODUTO                     TOTAL\n";
        itensVendidos.forEach(item => {
            const qtd = `${item.quantidade}x`.padEnd(6);
            const nome = item.nome.substring(0, 24).padEnd(25);
            const tot = m(item.total).padStart(11);
            txt += `${qtd}${nome}${tot}\n`;
        });
    }

    txt += `\n\n\n.`;
    return txt;
};

// --- RECIBO DE TROCA DE OPERADOR ---
export const gerarReciboTrocaOperador = (antigo: string, novo: string, data: Date) => {
    let txt = '';
    txt += `${center('MARIA BONITA')}\n`;
    txt += `${center('TROCA DE OPERADOR')}\n`;
    txt += `${line('=')}\n`;
    txt += `DATA: ${data.toLocaleDateString()}  HORA: ${data.toLocaleTimeString()}\n\n`;
    txt += `SAI:    ${antigo.toUpperCase()}\n`;
    txt += `ENTRA:  ${novo.toUpperCase()}\n`;
    txt += `\n${line('=')}\n`;
    txt += `\n\n\n${center('_'.repeat(30))}\n${center('Assinatura')}\n\n.`;
    return txt;
};

// --- NOVO: IMPRESSÃO DE PEDIDOS PARA COZINHA/BAR ---
export const imprimirPedidoCozinha = (
    mesa: string,
    itens: { nome: string; quantidade: number; observacoes?: string; adicionais?: any[] }[],
    tipo: 'ABERTURA' | 'ADICAO',
    operador: string
) => {
    let txt = "--------------------------------\n";
    txt += `      PEDIDO - ${tipo}      \n`;
    txt += "--------------------------------\n";
    txt += `MESA: ${mesa}\n`;
    txt += `DATA: ${new Date().toLocaleString('pt-BR')}\n`;
    txt += `OPERADOR: ${operador}\n`;
    txt += "--------------------------------\n";
    txt += "QTD  ITEM\n";

    itens.forEach(item => {
        txt += `${item.quantidade}x   ${item.nome}\n`;

        // Verifica e imprime adicionais
        if (item.adicionais && Array.isArray(item.adicionais) && item.adicionais.length > 0) {
            item.adicionais.forEach(adc => {
                const nomeAdc = typeof adc === 'string' ? adc : adc.nome;
                txt += `      + ${nomeAdc}\n`;
            });
        }

        // Verifica e imprime observações
        if (item.observacoes) {
            txt += `      (OBS: ${item.observacoes})\n`;
        }
    });

    txt += "--------------------------------\n";
    txt += "\n\n";

    // Chama a função de impressão interna
    imprimirRelatorio(txt);
};

// --- FUNÇÃO DE IMPRESSÃO (IFRAME OCULTO) ---
export const imprimirRelatorio = (texto: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const style = `
        <style>
            @page { size: auto; margin: 0mm; }
            body { 
                margin: 0; 
                padding: 5px; 
                font-family: 'Courier New', Courier, monospace; 
                font-size: 13px; 
                line-height: 1.2; 
                font-weight: 600; 
                white-space: pre; 
                width: 100%;
                color: #000;
            }
        </style>
    `;

    doc.open();
    doc.write(`<html><head><title>Print</title>${style}</head><body>${texto}</body></html>`);
    doc.close();

    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 500);
        }, 300);
    };
};