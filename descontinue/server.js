const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/print', async (req, res) => {
  const { orderNumber, items, total } = req.body;
  let texto = `PEDIDO #${orderNumber}\n---------------------\n`;
  items.forEach(i => texto += `${i.nome} x${i.quantidade} - R$ ${(i.preco * i.quantidade).toFixed(2)}\n`);
  texto += `---------------------\nTOTAL: R$ ${total.toFixed(2)}\nObrigado!\n\n`;

  try {
    await axios.post('http://localhost:8080/api/v1/imprimir-texto', {
      texto,
      alinhamento: "Centralizado",
      negrito: false,
      italico: false,
      sublinhado: false,
      expandido: false,
      condensado: false,
      cortarPapel: true
    });
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(3001, () => console.log('Backend rodando em http://localhost:3001'));
