import { RelatorioData } from "@/lib/services/caixa";

// Utilitários de formatação
const m = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const line = (char = '-', length = 48) => char.repeat(length);
const center = (text: string, length = 48) => {
    const spaces = Math.max(0, length - text.length);
    const padLeft = Math.floor(spaces / 2);
    return ' '.repeat(padLeft) + text + ' '.repeat(spaces - padLeft);
};
const row = (label: string, value: string, length = 48) => {
    const dots = Math.max(0, length - label.length - value.length - 1);
    return `${label} ${'.'.repeat(dots)} ${value}`;
};

// --- GERAÇÃO DO RECIBO DE PEDIDO (Separado em Vias) ---
export const gerarViasRecibo = (
    pedido: any,
    pagamentos: Record<string, number>,
    troco: number,
    docCliente: string,
    tipoDoc: string,
    desconto?: { valorCalculado: number },
    parcelas?: number
) => {

    // Função base para gerar o corpo comum (Itens e Totais)
    const gerarCorpoPedido = () => {
        let txt = '';
        txt += `Data: ${new Date().toLocaleDateString('pt-BR')}  Hora: ${new Date().toLocaleTimeString('pt-BR')}\n`;
        txt += `Mesa: ${String(pedido.mesa).padEnd(5)} Pedido: #${pedido.docId.slice(0, 4).toUpperCase()}\n`;

        if (docCliente && docCliente.trim().length > 0) txt += `${tipoDoc}: ${docCliente}\n`;
        else txt += `Consumidor não identificado\n`;

        txt += `${line()}\n`;
        txt += `ITEM                           QTD    TOTAL\n`;

        pedido.itens.forEach((item: any) => {
            const totalItem = item.precoUnitario * item.quantidade;
            const nome = item.nome.substring(0, 30).padEnd(30, ' ');
            const qtd = String(item.quantidade).padStart(3, ' ');
            const tot = totalItem.toFixed(2).padStart(8, ' ');
            txt += `${nome} ${qtd} ${tot}\n`;
        });
        txt += `${line()}\n`;

        const valorOriginal = pedido.valorOriginal || pedido.total;
        const valorDesconto = desconto?.valorCalculado || 0;
        const totalFinal = valorOriginal - valorDesconto;

        if (valorDesconto > 0) {
            txt += `${row('SUBTOTAL', m(valorOriginal))}\n`;
            txt += `${row('DESCONTO', `-${m(valorDesconto)}`)}\n`;
        }

        txt += `${row('TOTAL A PAGAR', m(totalFinal))}\n`;
        return txt;
    };

    const gerarPagamentos = () => {
        let txt = '';
        txt += `${line()}\n`;
        txt += `FORMAS DE PAGAMENTO:\n`;
        Object.entries(pagamentos).forEach(([metodo, valor]) => {
            if (valor > 0) {
                let label = metodo;
                if (metodo === 'Cartão Crédito' && parcelas && parcelas > 1) {
                    label += ` (${parcelas}x)`;
                }
                txt += `${row(label, m(valor))}\n`;
            }
        });
        if (troco > 0) {
            txt += `${line('.')}\n`;
            txt += `${row('TROCO', m(troco))}\n`;
        }
        return txt;
    };

    // --- MONTAGEM DA VIA DO CLIENTE ---
    const viaCliente = () => {
        let txt = '';
        txt += `${center('MARIA BONITA')}\n`;
        txt += `${center('RESTAURANTE E PETISCARIA')}\n`;
        txt += `${center('CNPJ: 12.345.678/0001-90')}\n`;
        txt += `${line()}\n`;
        txt += `${center('VIA DO CLIENTE')}\n`;
        txt += `${line()}\n`;

        txt += gerarCorpoPedido();
        txt += gerarPagamentos();

        txt += `\n${center('OBRIGADO PELA PREFERENCIA')}\n`;
        txt += `${center('Volte Sempre!')}\n\n`;
        return txt;
    };

    // --- MONTAGEM DA VIA DO ESTABELECIMENTO ---
    const viaEstabelecimento = () => {
        let txt = '';
        txt += `${center('MARIA BONITA')}\n`;
        txt += `${line()}\n`;
        txt += `${center('VIA DO ESTABELECIMENTO')}\n`;
        txt += `${center('CONTROLE INTERNO')}\n`;
        txt += `${line()}\n`;

        txt += gerarCorpoPedido();
        txt += gerarPagamentos();

        txt += `\n\n\n`;
        txt += `${center('________________________________')}\n`;
        txt += `${center('ASSINATURA / RUBRICA')}\n\n`;
        return txt;
    };

    // Retorna o objeto com as vias separadas
    return {
        viaCliente: viaCliente(),
        viaEstabelecimento: viaEstabelecimento()
    };
};

// --- GERAÇÃO DO RELATÓRIO DE CAIXA ---
export const gerarCupomTexto = (dados: RelatorioData, tipo: 'PARCIAL' | 'FECHAMENTO', operador: string) => {
    const { sessao, vendas, esperado, itensVendidos, saidas } = dados; // Extraindo itensVendidos
    let txt = '';

    txt += `${center('MARIA BONITA')}\n`;
    txt += `${center('CONTROLE DE CAIXA')}\n`;
    txt += `${line('=')}\n`;
    txt += `${center(tipo === 'FECHAMENTO' ? 'FECHAMENTO DE CAIXA' : 'RELATORIO PARCIAL')}\n`;
    txt += `${line('=')}\n`;

    const abertura = sessao.dataAbertura?.toDate ? sessao.dataAbertura.toDate() : new Date();
    const fechamento = sessao.dataFechamento?.toDate ? sessao.dataFechamento.toDate() : new Date();

    txt += `Operador: ${operador}\n`;
    txt += `Abertura: ${abertura.toLocaleString('pt-BR')}\n`;
    if (tipo === 'FECHAMENTO') {
        txt += `Fechamen: ${fechamento.toLocaleString('pt-BR')}\n`;
    } else {
        txt += `Emissao : ${new Date().toLocaleString('pt-BR')}\n`;
    }

    // ---------------------------------------------------------
    // NOVO BLOCO: DETALHAMENTO DE ITENS (RANKING DE VENDAS)
    // ---------------------------------------------------------
    if (itensVendidos && itensVendidos.length > 0) {
        txt += `\n${line()}\n`;
        txt += `${center('ITENS VENDIDOS')}\n`;
        txt += `${line()}\n`;
        txt += "QTD  PRODUTO                         TOTAL\n";
        //      XXXX XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX R$XXXXXX

        itensVendidos.forEach(item => {
            const qtdStr = `${item.quantidade}x`.padEnd(5);
            // Nome com até 31 caracteres para caber numa linha de 48 chars junto com preço
            const nomeStr = item.nome.substring(0, 31).padEnd(32);
            const totalStr = m(item.total).padStart(11); // Ex: "R$ 1.200,00"

            txt += `${qtdStr}${nomeStr}${totalStr}\n`;
        });
    }
    // ---------------------------------------------------------

    txt += `\n${line()}\n`;
    txt += `${center('RESUMO FINANCEIRO')}\n`;
    txt += `${line()}\n`;

    txt += `VENDAS POR METODO:\n`;
    txt += `${row('Dinheiro', m(vendas.dinheiro))}\n`;
    txt += `${row('Cartao Credito', m(vendas.credito))}\n`;
    txt += `${row('Cartao Debito', m(vendas.debito))}\n`;
    txt += `${row('Pix', m(vendas.pix))}\n`;
    txt += `${row('Outros', m(vendas.outros))}\n`;
    txt += `${line('.')}\n`;
    txt += `${row('TOTAL VENDAS', m(vendas.total))}\n`;
    txt += `${line()}\n`;

    txt += `MOVIMENTACOES:\n`;
    txt += `${row('Fundo de Troco (+)', m(sessao.valorInicial))}\n`;

    const suprimentos = saidas.lista.filter(x => x.tipo === 'suprimento').reduce((a, b) => a + b.valor, 0);
    if (suprimentos > 0) txt += `${row('Suprimentos (+)', m(suprimentos))}\n`;

    if (saidas.total > 0) {
        txt += `${row('Sangrias (-)', m(saidas.total))}\n`;
        saidas.lista.filter(x => x.tipo === 'sangria').forEach(s => {
            const desc = s.descricao || 'Sem motivo';
            txt += `  - ${desc.substring(0, 25)}: ${m(s.valor)}\n`;
        });
    }
    txt += `${line()}\n`;

    txt += `${center('CONFERENCIA (ESPERADO)')}\n`;
    txt += `${row('Dinheiro na Gaveta', m(esperado.dinheiro))}\n`;
    txt += `${row('Cartao/Pix (Maq.)', m(esperado.cartaoPix))}\n`;
    txt += `${line('=')}\n`;
    txt += `${row('TOTAL GERAL', m(esperado.totalGeral))}\n`;

    if (tipo === 'FECHAMENTO' && dados.fechamento) {
        txt += `\n${line()}\n`;
        txt += `${center('APURACAO FINAL')}\n`;
        txt += `${line()}\n`;
        txt += `${row('Dinheiro Contado', m(dados.fechamento.dinheiroContado))}\n`;
        txt += `${row('Cartao/Pix Contado', m(dados.fechamento.cartaoPixContado))}\n`;

        const dif = dados.fechamento.diferenca;
        const labelDif = dif === 0 ? 'DIFERENCA' : (dif > 0 ? 'SOBRA (+)' : 'QUEBRA (-)');

        txt += `${line('.')}\n`;
        txt += `${row(labelDif, m(Math.abs(dif)))}\n`;

        if (dados.fechamento.observacoes) {
            txt += `\nObs: ${dados.fechamento.observacoes}\n`;
        }
    }

    txt += `\n\n${center('SISTEMA MARIA BONITA')}\n\n\n`;
    return txt;
};

// --- FUNÇÃO DE IMPRESSÃO ---
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

    // CSS para Elgin i7 Plus e térmicas padrão 80mm
    const style = `
        <style>
            @page { 
                size: 80mm auto; 
                margin: 0mm; 
            }
            body { 
                width: 72mm; /* Margem de segurança */
                margin: 0 auto; 
                padding: 2mm 0; 
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2;
                white-space: pre-wrap; 
                color: #000;
                background-color: #fff;
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
            }, 1000);
        }, 100);
    };
};