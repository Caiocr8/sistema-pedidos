import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './index.css'

function HistoricoPage() {
  const [historico, setHistorico] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

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

  const abrirConfirmacao = () => {
    setMostrarConfirmacao(true);
  };

  const fecharConfirmacao = () => {
    setMostrarConfirmacao(false);
  };

  const excluirHistorico = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      const deletePromises = querySnapshot.docs.map(documento =>
        deleteDoc(doc(db, 'pedidos', documento.id))
      );
      await Promise.all(deletePromises);
      setHistorico([]);
      setMostrarConfirmacao(false);
      alert('Histórico excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir histórico:', error);
      alert('Erro ao excluir histórico. Tente novamente.');
    }
  };


  return (
    <div className="sessao">
      <h2>Histórico de Pedidos</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Histórico de Pedidos</h2>
        {historico.length > 0 && (
          <button
            onClick={abrirConfirmacao}
            className="cancelar"
            style={{ padding: '8px 16px' }}
          >
            Excluir Histórico
          </button>
        )}
      </div>
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

      {mostrarConfirmacao && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir todo o histórico de pedidos? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={excluirHistorico} className="confirmar" style={{ flex: 1 }}>
                Sim, excluir
              </button>
              <button onClick={fecharConfirmacao} className="cancelar" style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoricoPage;