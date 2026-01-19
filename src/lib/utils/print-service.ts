import { RelatorioData } from "@/lib/services/caixa";

// --- UTILITÁRIOS DE FORMATAÇÃO ---

// Formata moeda (R$ 1.230,00)
const m = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Cria linhas divisórias
const line = (char = '-', length = 48) => char.repeat(length);

// Centraliza texto
const center = (text: string, length = 48) => {
    const trimmed = text.length > length ? text.substring(0, length) : text;
    const spaces = Math.max(0, length - trimmed.length);
    const padLeft = Math.floor(spaces / 2);
    return ' '.repeat(padLeft) + trimmed + ' '.repeat(spaces - padLeft);
};

// Cria linha com label à esquerda e valor à direita com preenchimento (ex: "Total ........... 10,00")
const row = (label: string, value: string, char = '.', length = 48) => {
    const valueStr = value;
    const labelStr = label.substring(0, length - valueStr.length - 2); // Corta label se necessário
    const dots = Math.max(0, length - labelStr.length - valueStr.length - 1);
    return `${labelStr} ${char.repeat(dots)} ${valueStr}`;
};

// Formata data/hora de objetos Firestore ou Date
const fmtTime = (dateObj: any) => {
    if (!dateObj) return '--:--';
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// --- GERAÇÃO DO RECIBO DE PEDIDO (CLIENTE/COZINHA) ---
export const gerarViasRecibo = (
    pedido: any,
    pagamentos: Record<string, number>,
    troco: number,
    docCliente: string,
    tipoDoc: string,
    desconto?: { valorCalculado: number },
    parcelas?: number
) => {
    const gerarCorpoPedido = () => {
        let txt = '';
        txt += `Data: ${new Date().toLocaleDateString('pt-BR')}  Hora: ${new Date().toLocaleTimeString('pt-BR')}\n`;
        txt += `Mesa: ${String(pedido.mesa).padEnd(5)} Pedido: #${pedido.docId.slice(0, 4).toUpperCase()}\n`;

        if (docCliente && docCliente.trim().length > 0) txt += `${tipoDoc}: ${docCliente}\n`;
        else txt += `Consumidor não identificado\n`;

        txt += `${line()}\n`;
        txt += `ITEM                           QTD     TOTAL\n`;
        txt += `${line()}\n`;

        pedido.itens.forEach((item: any) => {
            const totalItem = item.precoUnitario * item.quantidade;
            const nome = item.nome.substring(0, 28).padEnd(28, ' ');
            const qtd = String(item.quantidade).padStart(3, ' ');
            const tot = m(totalItem).padStart(10, ' ');
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

        txt += `${row('TOTAL A PAGAR', m(totalFinal), ' ')}\n`; // Espaço vazio para destaque
        return txt;
    };

    const gerarPagamentos = () => {
        let txt = '';
        txt += `${line()}\n`;
        txt += `FORMAS DE PAGAMENTO\n`;
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

    const viaCliente = () => {
        let txt = '';
        txt += `${center('MARIA BONITA RESTAURANTE')}\n`;
        txt += `${center('Recibo de Venda')}\n`;
        txt += `${line('=')}\n`;
        txt += gerarCorpoPedido();
        txt += gerarPagamentos();
        txt += `\n${center('Obrigado pela preferencia!')}\n\n`;
        return txt;
    };

    const viaEstabelecimento = () => {
        let txt = '';
        txt += `${center('CONTROLE INTERNO')}\n`;
        txt += `${line('=')}\n`;
        txt += gerarCorpoPedido();
        txt += gerarPagamentos();
        txt += `\n\n\n${center('________________________________')}\n${center('Assinatura')}\n\n`;
        return txt;
    };

    return { viaCliente: viaCliente(), viaEstabelecimento: viaEstabelecimento() };
};

// --- GERAÇÃO DO RELATÓRIO DE CAIXA (FECHAMENTO) ---
export const gerarCupomTexto = (dados: RelatorioData, tipo: 'PARCIAL' | 'FECHAMENTO', operador: string) => {
    const { sessao, vendas, esperado, itensVendidos, saidas } = dados;
    let txt = '';

    // 1. CABEÇALHO
    txt += `${center('MARIA BONITA RESTAURANTE')}\n`;
    txt += `${center(tipo === 'FECHAMENTO' ? 'FECHAMENTO DE CAIXA' : 'CONFERENCIA PARCIAL')}\n`;
    txt += `${line('=')}\n`;

    const abertura = sessao.dataAbertura?.toDate ? sessao.dataAbertura.toDate() : new Date();
    const fechamento = sessao.dataFechamento?.toDate ? sessao.dataFechamento.toDate() : new Date();

    txt += `OPERADOR : ${operador.toUpperCase()}\n`;
    txt += `ABERTURA : ${abertura.toLocaleString('pt-BR')}\n`;
    if (tipo === 'FECHAMENTO') {
        txt += `FECHAM.  : ${fechamento.toLocaleString('pt-BR')}\n`;
    } else {
        txt += `EMISSAO  : ${new Date().toLocaleString('pt-BR')}\n`;
    }
    txt += `${line('=')}\n\n`;

    // 2. DETALHAMENTO DE MOVIMENTAÇÕES (SUPRIMENTOS E SANGRIAS)

    // Filtra movimentações da lista "saidas" que contém tudo
    // Nota: No seu service 'saidas.lista' contém todas as movs manuais (sangria e suprimento)
    const listaMovimentos = saidas.lista || [];
    const suprimentosLista = listaMovimentos.filter(x => x.tipo === 'suprimento');
    const sangriasLista = listaMovimentos.filter(x => x.tipo === 'sangria');

    const totalSuprimentos = suprimentosLista.reduce((acc, curr) => acc + curr.valor, 0);
    const totalSangrias = sangriasLista.reduce((acc, curr) => acc + curr.valor, 0);

    // Bloco Suprimentos
    if (suprimentosLista.length > 0) {
        txt += `[+] SUPRIMENTOS (ENTRADAS)\n`;
        suprimentosLista.forEach(s => {
            const hora = fmtTime(s.data);
            const desc = (s.descricao || 'Sem descrição').substring(0, 25);
            // Formato: 10:00 - Motivo ............ 50,00
            txt += `${hora} - ${row(desc, m(s.valor), '.', 38)}\n`;
        });
        txt += `${row('TOTAL SUPRIMENTOS', m(totalSuprimentos), ' ')}\n`;
        txt += `${line()}\n`;
    }

    // Bloco Sangrias
    if (sangriasLista.length > 0) {
        txt += `[-] SANGRIAS (SAIDAS)\n`;
        sangriasLista.forEach(s => {
            const hora = fmtTime(s.data);
            const desc = (s.descricao || 'Sem descrição').substring(0, 25);
            txt += `${hora} - ${row(desc, m(s.valor), '.', 38)}\n`;
        });
        txt += `${row('TOTAL SANGRIAS', m(totalSangrias), ' ')}\n`;
        txt += `${line()}\n`;
    }

    // 3. RESUMO DE VENDAS
    txt += `\n${center('RESUMO DE VENDAS (SISTEMA)')}\n`;
    txt += `${line('-')}\n`;
    txt += `${row('Dinheiro', m(vendas.dinheiro))}\n`;
    txt += `${row('Pix', m(vendas.pix))}\n`;
    txt += `${row('Cartao Credito', m(vendas.credito))}\n`;
    txt += `${row('Cartao Debito', m(vendas.debito))}\n`;
    if (vendas.outros > 0) txt += `${row('Outros / Voucher', m(vendas.outros))}\n`;
    txt += `${line()}\n`;
    txt += `${row('TOTAL BRUTO VENDAS', m(vendas.total), ' ')}\n\n`;

    // 4. BALANÇO DO CAIXA (MATEMÁTICA DA GAVETA)
    txt += `${center('CONFERENCIA GAVETA (DINHEIRO)')}\n`;
    txt += `${line('-')}\n`;
    txt += `${row('(+) Saldo Inicial', m(sessao.valorInicial))}\n`;
    txt += `${row('(+) Vendas em Dinheiro', m(vendas.dinheiro))}\n`;
    if (totalSuprimentos > 0) txt += `${row('(+) Suprimentos', m(totalSuprimentos))}\n`;
    if (totalSangrias > 0) txt += `${row('(-) Sangrias', m(totalSangrias))}\n`;
    txt += `${line()}\n`;

    // Valor que o sistema calcula que deve ter
    txt += `${row('(=) ESPERADO NA GAVETA', m(esperado.dinheiro), ' ')}\n`;

    // Se for fechamento, mostra o contado e a diferença
    if (tipo === 'FECHAMENTO' && dados.fechamento) {
        txt += `${row('(=) CONTADO PELO OPERADOR', m(dados.fechamento.dinheiroContado), ' ')}\n`;
        txt += `${line()}\n`;

        const dif = dados.fechamento.diferenca;
        const labelDif = dif === 0 ? 'DIFERENCA' : (dif > 0 ? 'SOBRA DE CAIXA' : 'QUEBRA DE CAIXA');

        // Se houver diferença, destaca com asteriscos
        const valorDifFormatted = (dif > 0 ? '+ ' : '- ') + m(Math.abs(dif));
        txt += `${row(labelDif, valorDifFormatted, ' ')}\n`;

        if (dados.fechamento.observacoes) {
            txt += `\nOBS: ${dados.fechamento.observacoes}\n`;
        }
    } else {
        txt += `\n*** CONFERENCIA PARCIAL ***\n`;
    }

    txt += `\n`;

    // 5. ITENS VENDIDOS (RANKING)
    if (itensVendidos && itensVendidos.length > 0) {
        txt += `${line('=')}\n`;
        txt += `${center('DETALHAMENTO DE ITENS')}\n`;
        txt += `${line('-')}\n`;
        txt += "QTD   PRODUTO                        TOTAL\n";
        //      XXXX  XXXXXXXXXXXXXXXXXXXXXXXXXXXX   R$XXXX

        itensVendidos.forEach(item => {
            const qtdStr = `${item.quantidade}x`.padEnd(6);
            const nomeStr = item.nome.substring(0, 28).padEnd(29);
            const totalStr = m(item.total).padStart(11);

            txt += `${qtdStr}${nomeStr}${totalStr}\n`;
        });
        txt += `${line('=')}\n`;
    }

    txt += `\n\n\n\n.`; // Ponto final para garantir o corte do papel
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

    // CSS Otimizado para Impressora Térmica (80mm ou 58mm ajustável)
    // Usamos 'pre-wrap' para respeitar as quebras de linha e espaços do texto gerado
    const style = `
        <style>
            @page { 
                size: 80mm auto; 
                margin: 0mm; 
            }
            body { 
                width: 72mm; /* Margem de segurança para impressoras de 80mm */
                margin: 0 auto; 
                padding: 10px 2px; 
                font-family: 'Courier New', Courier, monospace; /* Fonte monoespaçada é crucial */
                font-size: 13px; 
                font-weight: bold;
                line-height: 1.1;
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
        }, 300);
    };
};