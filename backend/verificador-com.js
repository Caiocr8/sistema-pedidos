// verificador-com.js

import * as SerialPort from 'serialport';

async function listarPortas() {
  try {
    const portas = await SerialPort.SerialPort.list();
    
    if (portas.length === 0) {
      console.log('Nenhuma porta COM encontrada.');
      return;
    }

    console.log('Portas COM disponíveis:');
    portas.forEach((porta, index) => {
      console.log(`(${index + 1}) ${porta.path} - ${porta.manufacturer || 'Fabricante desconhecido'}`);
    });

  } catch (err) {
    console.error('Erro ao listar portas:', err);
  }
}

listarPortas();
