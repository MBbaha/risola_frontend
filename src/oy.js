// Oy.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MijozlarRoyxati from './MijozlarRoyxati';
import './yanvar.css';

export default function Oy() {
  const { oy } = useParams(); // URL dan oy nomini oladi
  const navigate = useNavigate();

  return (
    <div className="yanvar-container">
      <h2>📅 {oy.charAt(0).toUpperCase() + oy.slice(1)} oyidagi mijozlar</h2>

      <div className="yanvar-button-group">
        <button className="yanvar-back-button" onClick={() => navigate('/')}>
          ⬅️ Asosiy sahifaga qaytish
        </button>
      </div>

      <MijozlarRoyxati oy={oy} />
    </div>
  );
}
