import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './index.css'

function HistoricoPage() {
  const [historico, setHistorico] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pedidos'));
        const lista = querySnapshot.docs.map(doc => doc.data());
        setHistorico(lista);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };
    carregarHistorico();
  }, []);

  const abrirModal = (pedido) => {
    setPedidoSelecionado(pedido);
  };

  const fecharModal = () => {
    setPedidoSelecionado(null);
  };

  return (
    <div className="sessao">
      <h2>Histórico de Pedidos</h2>
      {historico.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <ul className="carrinho">
          {historico.map((pedido, index) => (
            <li key={index} onClick={() => abrirModal(pedido)} style={{ cursor: 'pointer' }}>
              Pedido #{pedido.orderNumber} - Total: R$ {pedido.total.toFixed(2)}<br />
              <small>{new Date(pedido.timestamp).toLocaleString('pt-BR')}</small>
            </li>
          ))}
        </ul>
      )}

      {pedidoSelecionado && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Pedido #{pedidoSelecionado.orderNumber}</h3>
            <ul>
              {pedidoSelecionado.items.map((item, i) => (
                <li key={i}>
                  {item.nome} x{item.quantidade} - R$ {item.precoTotal.toFixed(2)}
                  {item.adicionais?.length > 0 && (
                    <ul style={{ paddingLeft: '1rem', marginTop: '4px' }}>
                      {item.adicionais.map((adc, idx) => (
                        <li key={idx}>+ {adc.nome} (R$ {adc.preco.toFixed(2)})</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p><strong>Total:</strong> R$ {pedidoSelecionado.total.toFixed(2)}</p>
            <button onClick={fecharModal} className="cancelar" style={{ marginTop: '10px' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoricoPage;