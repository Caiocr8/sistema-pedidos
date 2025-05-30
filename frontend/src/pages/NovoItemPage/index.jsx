import React, { useState, useEffect } from 'react';
import categoriasFixas from '../../data/categorias';
import { salvarMenuCompleto, carregarMenuCompleto } from '../../firebase';
import './index.css';

function NovoItemPage() {
  const [menu, setMenu] = useState([]);
  const [novoItem, setNovoItem] = useState({ id: null, nome: '', preco: '', categoria: '' });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [status, setStatus] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmarSalvar, setConfirmarSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregarCardapio = async () => {
      try {
        const dadosFirebase = await carregarMenuCompleto();
        if (dadosFirebase?.length) {
          setMenu(dadosFirebase);
          localStorage.setItem('menu', JSON.stringify(dadosFirebase));
          window.dispatchEvent(new CustomEvent('menuAtualizado', { detail: dadosFirebase }));
        } else {
          const menuSalvo = localStorage.getItem('menu');
          const data = menuSalvo ? JSON.parse(menuSalvo) : [];
          setMenu(data);
          window.dispatchEvent(new CustomEvent('menuAtualizado', { detail: data }));
        }
      } catch (error) {
        console.error('Erro ao carregar cardápio do Firebase:', error);
      }
    };

    carregarCardapio();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddOrUpdateItem();
      }
      if (e.key === 'Escape') {
        if (modoEdicao) {
          cancelarEdicao();
          document.activeElement.blur(); // remove foco de qualquer botão
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modoEdicao, novoItem]);

  const atualizarMenu = (novoMenu) => {
    setMenu(novoMenu);
    localStorage.setItem('menu', JSON.stringify(novoMenu));
    window.dispatchEvent(new CustomEvent('menuAtualizado', { detail: novoMenu }));
  };

  const handleAddOrUpdateItem = () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.categoria) {
      setErro('Todos os campos devem ser preenchidos!');
      return;
    }

    if (modoEdicao) {
      const atualizado = menu.map(item => item.id === novoItem.id ? {
        ...item,
        nome: novoItem.nome,
        preco: parseFloat(novoItem.preco),
        categoria: novoItem.categoria
      } : item);
      atualizarMenu(atualizado);
      setModoEdicao(false);
    } else {
      const novoId = menu.length ? Math.max(...menu.map(i => i.id)) + 1 : 1;
      const novo = {
        id: novoId,
        nome: novoItem.nome,
        preco: parseFloat(novoItem.preco),
        categoria: novoItem.categoria
      };
      atualizarMenu([...menu, novo]);
    }

    setNovoItem({ id: null, nome: '', preco: '', categoria: '' });
  };

  const removerItemMenu = (id) => {
    const atualizado = menu.filter(item => item.id !== id);
    atualizarMenu(atualizado);
    if (modoEdicao && novoItem.id === id) {
      cancelarEdicao();
    }
  };

  const editarItem = (item) => {
    setNovoItem({ ...item, preco: item.preco.toString() });
    setModoEdicao(true);
  };

  const cancelarEdicao = () => {
    setModoEdicao(false);
    setNovoItem({ id: null, nome: '', preco: '', categoria: '' });
  };

  const handleSalvarCardapio = async () => {
    setSalvando(true);
    try {
      await salvarMenuCompleto(menu);
      setStatus({ success: true, message: 'Cardápio salvo com sucesso!' });
    } catch (err) {
      setStatus({ success: false, message: 'Erro ao salvar: ' + err.message });
    }
    setSalvando(false);
    setConfirmarSalvar(false);
  };

  return (
    <div className="sessao">
      <h2>{modoEdicao ? 'Editar Item do Cardápio' : 'Adicionar Novo Item ao Cardápio'}</h2>

      <div className="novo-item">
        <input
          type="text"
          placeholder="Nome"
          value={novoItem.nome}
          onChange={e => setNovoItem({ ...novoItem, nome: e.target.value })}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Preço"
          value={novoItem.preco}
          onChange={e => setNovoItem({ ...novoItem, preco: e.target.value })}
        />
        <select
          value={novoItem.categoria}
          onChange={e => setNovoItem({ ...novoItem, categoria: e.target.value })}
        >
          <option value="">Selecione uma categoria</option>
          {categoriasFixas.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
        <div className='btn-group'>
          <button onClick={handleAddOrUpdateItem}>
            {modoEdicao ? 'Salvar Edição' : 'Adicionar ao Cardápio'}
          </button>
          {modoEdicao && (
            <button className="cancelar" onClick={cancelarEdicao}>Cancelar</button>
          )}
          {!modoEdicao && (
            <button className="salvar-btn" onClick={() => setConfirmarSalvar(true)}>
              Salvar o Cardápio
            </button>
          )}
        </div>
      </div>

      <ul className="carrinho">
        {menu.map((item) => (
          <li key={item.id}>
            {item.nome} - R$ {item.preco.toFixed(2)} ({item.categoria})
            <div className='carrinho-btn-group'> 
              <button onClick={() => editarItem(item)}>Editar</button>
              <button onClick={() => removerItemMenu(item.id)}>Remover</button>
            </div>
          </li>
        ))}
      </ul>

      {erro && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{erro}</h3>
            <div className="botoes">
              <button className="confirmar" onClick={() => setErro('')}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {confirmarSalvar && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {salvando ? (
                <span>
                  Salvando<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                </span>
              ) : 'Deseja salvar o cardápio?'}
            </h3>
            <div className="botoes">
              {!salvando && (
                <>
                  <button className="cancelar" onClick={() => setConfirmarSalvar(false)}>Cancelar</button>
                  <button className="confirmar" onClick={handleSalvarCardapio}>Sim, Salvar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {status && !confirmarSalvar && !salvando && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{status.message}</h3>
            <div className="botoes">
              <button className="confirmar" onClick={() => setStatus(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NovoItemPage;
