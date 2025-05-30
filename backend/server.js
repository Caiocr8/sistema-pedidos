const express = require('express');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'usb', // ajuste para '/dev/usb/lp0' no Linux se necessário
});

app.post('/print', async (req, res) => {
    const { orderNumber, items, total } = req.body;

    try {
        for (let i = 0; i < 2; i++) { // imprime duas vias
            printer.clear();
            printer.alignCenter();
            printer.println(`PEDIDO #${orderNumber}`);
            printer.println(i === 0 ? 'VIA CLIENTE' : 'VIA ESTABELECIMENTO');
            printer.drawLine();
            items.forEach((item) => {
                printer.println(`${item.nome} x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}`);
            });
            printer.drawLine();
            printer.println(`TOTAL: R$ ${total.toFixed(2)}`);
            printer.newLine();
            printer.cut();
            await printer.execute();
        }

        res.send({ success: true });
    } catch (error) {
        console.error('Erro ao imprimir:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.listen(3001, () => {
    console.log('Servidor de impressora rodando na porta 3001');
});