import { CaixaSessao, RelatorioData } from "@/lib/services/caixa";

// Formata moeda
const m = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cria linha tracejada ou dupla
const line = (char = '-', length = 40) => char.repeat(length);

// Centraliza texto
const center = (text: string, length = 40) => {
    const spaces = Math.max(0, length - text.length);
    const padLeft = Math.floor(spaces / 2);
    return ' '.repeat(padLeft) + text + ' '.repeat(spaces - padLeft);
};

// Cria linha de par chave/valor com pontos (Ex: Dinheiro.......... R$ 10,00)
const row = (label: string, value: string, length = 40) => {
    const dots = Math.max(0, length - label.length - value.length - 1);
    return `${label}${' '.repeat(1)}${'.'.repeat(dots)} ${value}`; // Ajuste sutil para visual limpo
};

export const gerarCupomTexto = (dados: RelatorioData, tipo: 'PARCIAL' | 'FECHAMENTO', operador: string) => {
    const now = new Date();
    const dataImpressao = now.toLocaleDateString('pt-BR');
    const horaImpressao = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let txt = '';

    // CABEÇALHO
    txt += `${line('=')}\n`;
    txt += `${center(tipo === 'PARCIAL' ? 'RELATÓRIO PARCIAL' : 'RELATÓRIO DE CAIXA')}\n`;
    txt += `${center('MARIA BONITA')}\n`; // Nome do restaurante
    txt += `${line('=')}\n`;
    txt += `CNPJ: 00.000.000/0001-00\n`; // Configure seu CNPJ
    txt += `PDV: Caixa 01\n`;
    txt += `Operador: ${dados.sessao.usuarioNome.split(' ')[0]}\n`;
    txt += `Data: ${dados.sessao.dataAbertura.toDate().toLocaleDateString('pt-BR')}\n`;
    txt += `Abertura: ${dados.sessao.dataAbertura.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (tipo === 'FECHAMENTO') {
        txt += `Fechamento: ${horaImpressao}\n`;
    } else {
        txt += `Consulta: ${horaImpressao}\n`;
    }
    txt += `${line('=')}\n\n`;

    // SALDO INICIAL
    txt += `SALDO INICIAL (TROCO)\n`;
    txt += `${m(dados.sessao.valorInicial)}\n\n`;

    // ENTRADAS (VENDAS)
    txt += `${line()}\n`;
    txt += `ENTRADAS (VENDAS)\n`;
    txt += `${line()}\n`;
    txt += `${row('Dinheiro', m(dados.vendas.dinheiro))}\n`;
    txt += `${row('Cartão Débito', m(dados.vendas.debito))}\n`;
    txt += `${row('Cartão Crédito', m(dados.vendas.credito))}\n`;
    txt += `${row('Pix', m(dados.vendas.pix))}\n`;
    txt += `${row('Outros/Vale', m(dados.vendas.outros))}\n`;
    txt += `${line()}\n`;
    txt += `${row('TOTAL DE VENDAS', m(dados.vendas.total))}\n\n`;

    // SAÍDAS
    txt += `${line()}\n`;
    txt += `SAÍDAS\n`;
    txt += `${line()}\n`;
    if (dados.saidas.lista.length === 0) {
        txt += `(Nenhuma saída registrada)\n`;
    } else {
        dados.saidas.lista.forEach(s => {
            const hora = s.data.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            txt += `${row(`${s.descricao} (${hora})`, m(s.valor))}\n`;
        });
    }
    txt += `${line()}\n`;
    txt += `${row('TOTAL DE SAÍDAS', m(dados.saidas.total))}\n\n`;

    // APURAÇÃO
    txt += `${line()}\n`;
    txt += `APURAÇÃO DO CAIXA\n`;
    txt += `${line()}\n`;

    // No parcial, mostra apenas o esperado. No fechamento, mostra o contado.
    if (tipo === 'PARCIAL') {
        txt += `${row('Dinheiro em Caixa (Est.)', m(dados.esperado.dinheiro))}\n`;
        txt += `${row('Total Geral (Est.)', m(dados.esperado.totalGeral))}\n`;
    } else {
        txt += `${row('Dinheiro Esperado', m(dados.esperado.dinheiro))}\n`;
        txt += `${row('Dinheiro Contado', m(dados.fechamento?.dinheiroContado || 0))}\n`;
        txt += `${line('.')}\n`;
        txt += `${row('Cartões/Pix Esperado', m(dados.esperado.cartaoPix))}\n`;
        txt += `${row('Cartões/Pix Conferido', m(dados.fechamento?.cartaoPixContado || 0))}\n`;
    }
    txt += `\n`;

    // DIFERENÇA E SALDO FINAL (Apenas Fechamento)
    if (tipo === 'FECHAMENTO' && dados.fechamento) {
        const diferenca = dados.fechamento.diferenca;
        txt += `${line()}\n`;
        txt += `DIFERENÇA\n`;
        txt += `${line()}\n`;
        txt += `${row('Quebra/Sobra', m(diferenca))}\n`;
        txt += `Status: ${diferenca === 0 ? 'OK' : diferenca > 0 ? 'SOBRA DE CAIXA' : 'QUEBRA DE CAIXA'}\n\n`;

        txt += `${line()}\n`;
        txt += `SALDO FINAL\n`;
        txt += `${line()}\n`;
        txt += `${row('Valor Final em Caixa', m(dados.fechamento.dinheiroContado))}\n`;
        // Assumindo que o que sobra é entregue, ou mantido. Aqui simplificado:
        txt += `${row('Valor Apurado Total', m(dados.fechamento.totalGeralContado))}\n\n`;
    }

    // OBSERVAÇÕES
    if (dados.fechamento?.observacoes || tipo === 'PARCIAL') {
        txt += `${line()}\n`;
        txt += `OBSERVAÇÕES\n`;
        txt += `${line()}\n`;
        txt += `${dados.fechamento?.observacoes || 'Sem observações.'}\n\n`;
    }

    // ASSINATURAS
    txt += `${line()}\n`;
    txt += `ASSINATURAS\n`;
    txt += `${line()}\n\n\n`;
    txt += `Operador: _____________________________\n\n`;
    txt += `Gerente:  _____________________________\n\n`;

    txt += `${line('=')}\n`;
    txt += `${center(tipo === 'PARCIAL' ? 'CONFERÊNCIA INTERNA' : 'COMPROVANTE DE CAIXA')}\n`;
    txt += `${line('=')}\n`;

    return txt;
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
            <title>Imprimir Relatório</title>
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