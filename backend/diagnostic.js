// diagnostico.js

import ffi from 'ffi-napi';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Caminho absoluto para a DLL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dllPath = path.resolve(__dirname, 'E1_Impressora01.dll');

// Carregando a DLL
const lib = new ffi.Library(dllPath, {
  'AbreConexaoImpressora': ['int32', ['int32', 'string', 'string', 'int32']],
  'FechaConexaoImpressora': ['int32', []],
  'CorteTotal': ['int32', ['int32']],
  'ImpressaoTexto': ['int32', ['string', 'int32', 'int32', 'int32']]
});

// Função principal de diagnóstico
async function diagnostico(porta, baudrate) {
  try {
    console.log(`Testando conexão na porta ${porta} @${baudrate}...`);

    const retAbre = lib.AbreConexaoImpressora(0, 'I7', porta, baudrate);
    console.log('AbreConexaoImpressora retornou:', retAbre);

    if (retAbre !== 0) {
      console.error('Falha ao abrir conexão. Código de erro:', retAbre);
      return;
    }

    const texto = "Teste de Impressao Elgin\n------------------------\nSucesso!\n\n";
    const retImp = lib.ImpressaoTexto(texto, 0, 0, 0);
    console.log('ImpressaoTexto retornou:', retImp);

    const retCorte = lib.CorteTotal(10);
    console.log('CorteTotal retornou:', retCorte);

    const retFecha = lib.FechaConexaoImpressora();
    console.log('FechaConexaoImpressora retornou:', retFecha);

    console.log('Diagnóstico concluído. Verifique a impressora.');
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

// Leitura de input do usuário
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Informe a porta COM (ex: COM4): ', (porta) => {
  rl.question('Informe o baudrate (ex: 19200): ', (baudrateStr) => {
    const baudrate = parseInt(baudrateStr, 10);
    rl.close();
    diagnostico(porta, baudrate);
  });
});
