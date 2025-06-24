// backend/server.js

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as SerialPort from 'serialport';
import ffi from 'ffi-napi';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dllPath = path.resolve(__dirname, 'E1_Impressora01.dll');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const lib = new ffi.Library(dllPath, {
  'AbreConexaoImpressora': ['int32', ['int32', 'string', 'string', 'int32']],
  'FechaConexaoImpressora': ['int32', []],
  'CorteTotal': ['int32', ['int32']],
  'ImpressaoTexto': ['int32', ['string', 'int32', 'int32', 'int32']]
});

async function detectarPortaImpressora() {
  try {
    const portas = await SerialPort.SerialPort.list();
    for (const porta of portas) {
      if ((porta.manufacturer && porta.manufacturer.toLowerCase().includes('elgin')) || porta.path.includes('COM')) {
        return porta.path;
      }
    }
    return null;
  } catch (err) {
    console.error('Erro ao listar portas:', err);
    return null;
  }
}

async function imprimirTexto(texto) {
  const porta = await detectarPortaImpressora();
  if (!porta) throw new Error('Nenhuma porta COM da impressora encontrada.');

  const baudrate = 19200;
  const retAbre = lib.AbreConexaoImpressora(0, 'I7', porta, baudrate);
  if (retAbre !== 0) throw new Error(`Falha ao abrir conexão. Código de erro: ${retAbre}`);

  const retImp = lib.ImpressaoTexto(texto, 0, 0, 0);
  const retCorte = lib.CorteTotal(10);
  const retFecha = lib.FechaConexaoImpressora();

  return { retAbre, retImp, retCorte, retFecha, porta }; 
}

app.get('/health', (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post('/print', async (req, res) => {
  try {
    const { orderNumber, items, total } = req.body;

    if (!orderNumber || !items || !total) {
      return res.status(400).send({ success: false, error: 'Dados incompletos no payload.' });
    }

    let texto = `PEDIDO #${orderNumber}\n---------------------\n`;
    items.forEach(item => {
      texto += `${item.nome} x${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
    });
    texto += `---------------------\nTOTAL: R$ ${total.toFixed(2)}\nObrigado!\n\n`;

    const resultado = await imprimirTexto(texto);
    console.log('Impressão realizada na porta:', resultado.porta);
    res.send({ success: true, porta: resultado.porta });
  } catch (err) {
    console.error('Erro na impressão:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.listen(3001, () => {
  console.log('Backend rodando em http://localhost:3001');
});
