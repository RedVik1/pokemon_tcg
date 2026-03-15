import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, PlusCircle, Trash2, LayoutDashboard } from 'lucide-react';
import './App.css';

function Market() {
  const [query, setQuery] = useState('Charizard');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [purchaseData, setPurchaseData] = useState({ price: '', condition: 'Raw / NM' });

  const searchMarket = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/market/search/${query}`);
      setCards(res.data.data);
    } catch (err) { alert("Ошибка API"); }
    setLoading(false);
  };

  const addToPortfolio = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/portfolio/add', {
        card_id: selectedCard.id,
        name: selectedCard.name,
        set_name: selectedCard.set,
        image_url: selectedCard.image,
        purchase_price: parseFloat(purchaseData.price) || selectedCard.price,
        market_price: selectedCard.price,
        condition: purchaseData.condition
      });
      alert(`Успешно добавлено в портфель!`);
      setSelectedCard(null);
    } catch (err) { alert("Ошибка БД"); }
  };

  return (
    <div className="page fade-in">
      <div className="header-section">
        <h2>Рынок TCG</h2>
        <div className="search-bar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название..." />
          <button onClick={searchMarket} disabled={loading}><Search size={18}/> Поиск</button>
        </div>
      </div>

      <div className="grid">
        {cards.map(card => (
          <div key={card.id} className="card-item">
            <img src={card.image} alt={card.name} />
            <div className="card-details">
              <h3>{card.name}</h3>
              <p className="set-name">{card.set}</p>
              <p className="price-tag">${card.price.toFixed(2)}</p>
              <button className="action-btn" onClick={() => setSelectedCard(card)}>
                <PlusCircle size={16}/> В портфель
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Добавить {selectedCard.name}</h3>
            <p>Текущая цена рынка: ${selectedCard.price}</p>
            <div className="input-group">
              <label>Вы купили за ($):</label>
              <input type="number" value={purchaseData.price} onChange={e => setPurchaseData({...purchaseData, price: e.target.value})} placeholder={selectedCard.price} />
            </div>
            <div className="input-group">
              <label>Состояние:</label>
              <select value={purchaseData.condition} onChange={e => setPurchaseData({...purchaseData, condition: e.target.value})}>
                <option>Raw / NM</option>
                <option>PSA 10 Gem Mint</option>
                <option>PSA 9 Mint</option>
                <option>Lightly Played</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedCard(null)}>Отмена</button>
              <button className="confirm" onClick={addToPortfolio}>Сохранить актив</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState({ stats: {}, chart_data: [], items: [] });

  const loadData = async () => {
    const res = await axios.get('http://127.0.0.1:8000/api/portfolio/analytics');
    setData(res.data);
  };
  useEffect(() => { loadData(); }, []);

  const removeItem = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/api/portfolio/${id}`);
    loadData();
  };

  const isProfit = data.stats.profit_loss >= 0;

  return (
    <div className="page fade-in dashboard-page">
      <div className="top-stats">
        <div className="stat-card total-value">
          <p>Рыночная стоимость</p>
          <h2>${data.stats.current_value?.toFixed(2) || '0.00'}</h2>
          <span className={isProfit ? 'profit' : 'loss'}>
            {isProfit ? '+$' : '-$'}{Math.abs(data.stats.profit_loss || 0).toFixed(2)} ({data.stats.roi_percent?.toFixed(2)}%)
          </span>
        </div>
        <div className="stat-card">
          <p>Инвестировано</p>
          <h2>${data.stats.total_invested?.toFixed(2) || '0.00'}</h2>
        </div>
        <div className="stat-card">
          <p>Активов (карт)</p>
          <h2>{data.stats.total_cards || 0}</h2>
        </div>
      </div>

      <div className="chart-container">
        <h3>Динамика портфеля (30 дней)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.chart_data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="inventory-list">
        <h3>Ваша коллекция</h3>
        <div className="grid">
          {data.items.map(item => (
            <div key={item.id} className="card-item inventory-item">
              <img src={item.image_url} alt={item.name} />
              <div className="card-details">
                <h3>{item.name}</h3>
                <span className="badge">{item.condition}</span>
                <div className="price-compare">
                  <p>Куплено: ${item.purchase_price}</p>
                  <p>Рынок: <span>${item.market_price}</span></p>
                </div>
                <button className="action-btn remove" onClick={() => removeItem(item.id)}>Продать актив</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="logo-area">
            <LayoutDashboard size={28} color="#3b82f6" />
            <h1>Collectr<span>Pro</span></h1>
          </div>
          <nav className="nav-links">
            <Link to="/"><LayoutDashboard size={20} /> Дашборд</Link>
            <Link to="/market"><Search size={20} /> Рынок TCG</Link>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}