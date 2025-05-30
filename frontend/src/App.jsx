import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PedidoPage from './pages/PedidoPage';
import HistoricoPage from './pages/HistoricoPage';
import NovoItemPage from './pages/NovoItemPage';
import Logo from './assets/Logo.png';
import './App.css'

function App() {
  return (
    <Router>
      <div className="container">
        <header className="topbar">
          <img src={Logo} alt="Maria Bonita - Das Tapiocas" />
          <nav>
            <Link to="/">Novo Pedido</Link>
            <Link to="/historico">Histórico</Link>
            <Link to="/novo-item">Novo Item</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<PedidoPage />} />
          <Route path="/historico" element={<HistoricoPage />} />
          <Route path="/novo-item" element={<NovoItemPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;