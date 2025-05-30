import React, { useState, useEffect, useRef } from 'react';
import adicionaisFixos from '../../data/adcionais';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './index.css';

function PedidoPage() {
  const [menu, setMenu] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [adicionais, setAdicionais] = useState({});
  const [mostrarAdicionais, setMostrarAdicionais] = useState({});
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmarTipo, setConfirmarTipo] = useState(null);
  const [orderNumber, setOrderNumber] = useState(1);
  const [modalMensagem, setModalMensagem] = useState('');
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const buscaRef = useRef(null);


  useEffect(() => {
    buscaRef.current?.focus();

    const carregarDadosIniciais = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pedidos'));
        const numeros = querySnapshot.docs.map(doc => doc.data().orderNumber);
        const max = numeros.length ? Math.max(...numeros) : 0;
        setOrderNumber(max + 1);

        const menuFirebase = await carregarMenu();
        setMenu(menuFirebase);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    carregarDadosIniciais();

    const handleMenuUpdate = (e) => {
      setMenu(e.detail);
    };
    window.addEventListener('menuAtualizado', handleMenuUpdate);
    return () => window.removeEventListener('menuAtualizado', handleMenuUpdate);
  }, []);

  useEffect(() => {
    buscaRef.current?.focus();

    const carregarUltimoPedido = async () => {
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      const numeros = querySnapshot.docs.map(doc => doc.data().orderNumber);
      const max = numeros.length ? Math.max(...numeros) : 0;
      setOrderNumber(max + 1);
    };

    const menuLocal = localStorage.getItem('menu');
    if (menuLocal) {
      setMenu(JSON.parse(menuLocal));
    }

    const handleMenuUpdate = (e) => {
      setMenu(e.detail);
    };
    window.addEventListener('menuAtualizado', handleMenuUpdate);

    carregarUltimoPedido();

    return () => window.removeEventListener('menuAtualizado', handleMenuUpdate);
  }, []);

  const adicionarItem = (item) => {
    const adicionaisSelecionados = adicionais[item.id] || [];
    const adicionaisDetalhados = adicionaisSelecionados.map(id => adicionaisFixos.find(a => a.id === id));
    const totalAdicionais = adicionaisDetalhados.reduce((acc, a) => acc + (a?.preco || 0), 0);

    const itemComAdicionais = {
      ...item,
      adicionais: adicionaisDetalhados,
      quantidade: 1,
      precoTotal: item.preco + totalAdicionais
    };

    setCarrinho(prev => [...prev, itemComAdicionais]);
    setAdicionais(prev => ({ ...prev, [item.id]: [] }));
    setMostrarAdicionais(prev => ({ ...prev, [item.id]: false }));
  };

  const removerItem = (index) => {
    setCarrinho(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAdicional = (itemId, adicionalId) => {
    setAdicionais(prev => {
      const atual = prev[itemId] || [];
      const existe = atual.includes(adicionalId);
      return {
        ...prev,
        [itemId]: existe ? atual.filter(id => id !== adicionalId) : [...atual, adicionalId]
      };
    });
  };

  const toggleMostrarAdicionais = (id) => {
    setMostrarAdicionais(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const finalizarPedido = async () => {
    if (carrinho.length === 0) return;

    const pedido = {
      orderNumber,
      items: carrinho,
      total: totalCarrinho,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'pedidos'), pedido);
      setOrderNumber(orderNumber + 1);
      setCarrinho([]);
      setModalMensagem('Pedido salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      setModalMensagem('Erro ao salvar pedido.');
    } finally {
      setMostrarConfirmacao(true);
    }
  };

  const abrirConfirmar = (tipo) => {
    setConfirmarTipo(tipo);
    setMostrarModal(true);
  };

  const confirmarAcao = () => {
    if (confirmarTipo === 'limpar') {
      setCarrinho([]);
    } else if (confirmarTipo === 'finalizar') {
      finalizarPedido();
    }
    setMostrarModal(false);
  };

  const cancelarLimpar = () => setMostrarModal(false);
  const fecharModalConfirmacao = () => setMostrarConfirmacao(false);

  const categorias = [...new Set(menu.map(item => item.categoria))];
  const menuFiltrado = menu.filter(item =>
    item.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.precoTotal, 0);

  return (
    <>
      <main className="container">
        <input
          type="text"
          ref={buscaRef}
          className="busca"
          placeholder="Buscar item..."
          value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
        />

        {categorias.map(categoria => (
          <div key={categoria} className="sessao">
            <h2>{categoria}</h2>
            {menuFiltrado.filter(i => i.categoria === categoria).map(item => {
              const adicionaisSelecionados = adicionais[item.id] || [];
              const totalAdicionais = adicionaisSelecionados.reduce((acc, id) => {
                const a = adicionaisFixos.find(a => a.id === id);
                return acc + (a?.preco || 0);
              }, 0);

              return (
                <div key={item.id} className="item">
                  <div className="item-info">
                    <strong>{item.nome}</strong>
                    <span>R$ {(item.preco + totalAdicionais).toFixed(2)}</span>
                  </div>

                  {item.categoria !== 'Bebida' && item.categoria !== 'Diversos' && (
                    <>
                      <button
                        className="adicionais-toggle"
                        onClick={() => toggleMostrarAdicionais(item.id)}
                      >
                        {mostrarAdicionais[item.id] ? 'Ocultar Adicionais' : 'Mostrar Adicionais'}
                      </button>
                      <div className={`adicionais ${mostrarAdicionais[item.id] ? 'mostrar' : ''}`}>
                        {adicionaisFixos.map(adc => (
                          <div
                            key={adc.id}
                            className="adicional-badge"
                            onClick={() => toggleAdicional(item.id, adc.id)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: (adicionais[item.id] || []).includes(adc.id) ? '#6b3e26' : '#fff4dc',
                              color: (adicionais[item.id] || []).includes(adc.id) ? '#fff8e7' : '#6b3e26'
                            }}
                          >
                            {adc.nome} (+R$ {adc.preco.toFixed(2)})
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button onClick={() => adicionarItem(item)}>Adicionar</button>
                </div>
              );
            })}
          </div>
        ))}

        <div className="sessao" style={{ marginBottom: '220px' }}>
          <h2>Resumo do Pedido</h2>
          <ul className="carrinho">
            {carrinho.map((item, i) => (
              <li key={i}>
                {item.nome} x{item.quantidade} - R$ {item.precoTotal.toFixed(2)}
                {item.adicionais?.length > 0 && (
                  <ul style={{ paddingLeft: '1rem', marginTop: '4px' }}>
                    {item.adicionais.map((adc, idx) => (
                      <li key={idx}>+ {adc.nome} (R$ {adc.preco.toFixed(2)})</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => removerItem(i)}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <div className="total-bar">
        <div className="total">Total: R$ {totalCarrinho.toFixed(2)}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="limpar" onClick={() => abrirConfirmar('limpar')}>Limpar Pedido</button>
          <button className="finalizar" onClick={() => abrirConfirmar('finalizar')}>Finalizar Pedido</button>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{confirmarTipo === 'limpar' ? 'Tem certeza que deseja limpar o pedido?' : 'Tem certeza que deseja finalizar o pedido?'}</h3>
            <div className="botoes">
              <button className="cancelar" onClick={cancelarLimpar}>Cancelar</button>
              <button className="confirmar" onClick={confirmarAcao}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmacao && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{modalMensagem}</h3>
            <div className="botoes">
              <button className="confirmar" onClick={fecharModalConfirmacao}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PedidoPage;