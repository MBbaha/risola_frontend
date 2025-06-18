import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Kvitansiya from './kvitansiya';
import YangiMijoz from './yangiMijoz';
import MijozlarRoyxati from './mijozlarRoyxati';
import HisobotDashboard from './hisobot';
import ChekRoyxati  from './chekRoyxati'

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1 className="home-title">📋 Mijozlar Boshqaruvi</h1>
      <div className="button-group">
        <button className="home-btn" onClick={() => navigate('/yangiMijoz')}>
          ➕ Yangi mijoz qo‘shish
        </button>
        <button className="home-btn" onClick={() => navigate('/mijozlarRoyxati')}>
          📑 Mijozlar ro‘yxati
        </button>
         <button className="home-btn" onClick={() => navigate('/hisobot')}>
         📈 Hisobotlarni olish
        </button>
        <button className="home-btn" onClick={() => navigate('/kvitansiya')}>
          🧾 Chek berish
        </button>
       
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/yangiMijoz" element={<YangiMijoz />} />
        <Route path="/mijozlarRoyxati" element={<MijozlarRoyxati />} />
        <Route path="/kvitansiya" element={<Kvitansiya />} />
        <Route path="/hisobot" element={<HisobotDashboard />} />
        <Route path="/chekRoyxati" element={<ChekRoyxati />} />
         
      </Routes>
    </Router>
  );
}

export default App;
