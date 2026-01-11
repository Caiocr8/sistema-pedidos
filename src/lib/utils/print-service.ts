import { CaixaSessao, RelatorioData } from "@/lib/services/caixa";

const m = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const line = (char = '-', length = 32) => char.repeat(length);
const center = (text: string, length = 32) => {
    const spaces = Math.max(0, length - text.length);
    const padLeft = Math.floor(spaces / 2);
    return ' '.repeat(padLeft) + text + ' '.repeat(spaces - padLeft);
};
const row = (label: string, value: string, length = 32) => {
    const dots = Math.max(0, length - label.length - value.length - 1);
    return `${label} ${'.'.repeat(dots)} ${value}`;
};

export const gerarTextoCupom = (
    pedido: any,
    pagamentos: Record<string, number>,
    troco: number,
    docCliente: string,
    tipoDoc: string,
    desconto?: { valorCalculado: number },
    parcelas?: number // ARGUMENTO ADICIONADO
) => {

    const gerarVia = (titulo: string) => {
        let txt = '';
        txt += `${center('MARIA BONITA')}\n`;
        txt += `${center('RESTAURANTE E PETISCARIA')}\n`;
        txt += `${center('CNPJ: 12.345.678/0001-90')}\n`;
        txt += `${line()}\n`;
        txt += `${center(titulo)}\n`;
        txt += `${line()}\n`;
        txt += `Data: ${new Date().toLocaleDateString('pt-BR')}  Hora: ${new Date().toLocaleTimeString('pt-BR')}\n`;
        txt += `Mesa: ${pedido.mesa}     Pedido: #${pedido.docId.slice(0, 4).toUpperCase()}\n`;

        if (docCliente) txt += `${tipoDoc}: ${docCliente}\n`;
        else txt += `Consumidor não identificado\n`;

        txt += `${line()}\n`;
        txt += `ITEM                  QTD   TOTAL\n`;
        pedido.itens.forEach((item: any) => {
            const totalItem = item.precoUnitario * item.quantidade;
            const nome = item.nome.substring(0, 20).padEnd(20, ' ');
            const qtd = String(item.quantidade).padStart(3, ' ');
            const tot = totalItem.toFixed(2).padStart(7, ' ');
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
        txt += `${line()}\n`;

        txt += `FORMAS DE PAGAMENTO:\n`;
        Object.entries(pagamentos).forEach(([metodo, valor]) => {
            if (valor > 0) {
                let label = metodo;
                // Exibe as parcelas se for crédito e parcelado
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

        txt += `\n\n${center('OBRIGADO PELA PREFERENCIA')}\n\n\n\n`;
        return txt;
    };

    return gerarVia('VIA DO CLIENTE') + `${line('=')}\n\n` + gerarVia('VIA DO ESTABELECIMENTO');
};

export const imprimirRelatorio = (texto: string) => {
    const width = 350;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const win = window.open('', 'PrintWindow', `width=${width},height=${height},top=${top},left=${left}`);
    if (!win) return;

    win.document.write(`
        <html>
        <head>
            <title>Imprimir</title>
            <style>
                body { margin: 0; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; color: #000; }
                @media print {
                    @page { margin: 0; }
                    body { padding: 5px; }
                }
            </style>
        </head>
        <body>${texto}</body>
        </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
        win.close();
    }, 500);
};

export const gerarCupomTexto = (dados: RelatorioData, tipo: 'PARCIAL' | 'FECHAMENTO', operador: string) => {
    // Mantendo placeholder ou função original caso já exista
    return "";
};