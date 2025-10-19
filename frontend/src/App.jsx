// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PedidoPage from './pages/PedidoPage';
import HistoricoPage from './pages/HistoricoPage';
import NovoItemPage from './pages/NovoItemPage';
import Logo from './assets/Logo.png';
import { carregarMenuCompleto } from './firebase';
import './App.css';

function App() {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    const carregarCardapio = async () => {
      try {
        const dadosFirebase = await carregarMenuCompleto();
        const data = dadosFirebase?.length
          ? dadosFirebase
          : JSON.parse(localStorage.getItem('menu') || '[]');

        setMenu(data);
        localStorage.setItem('menu', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('menuAtualizado', { detail: data }));
      } catch (error) {
        console.error('Erro ao carregar cardápio do Firebase:', error);
      }
    };

    carregarCardapio();
  }, []);

  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          <img src={Logo} alt="Maria Bonita - Das Tapiocas" />
          <nav>
            <Link to="/">Novo Pedido</Link>
            <Link to="/historico">Histórico</Link>
            <Link to="/novo-item">Novo Item</Link>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<PedidoPage />} />
            <Route path="/historico" element={<HistoricoPage />} />
            <Route path="/novo-item" element={<NovoItemPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
