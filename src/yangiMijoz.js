import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './yangiMijoz.css';

function YangiMijoz() {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [baho, setBaho] = useState(null); // boshida null

  const famRef = useRef();
  const ismRef = useRef();
  const locationRef = useRef();
  const sanaRef = useRef();
  const telRef = useRef();
  const summaRef = useRef();

  const handleSave = async () => {
    const fam = famRef.current.value.trim();
    const ism = ismRef.current.value.trim();
    const location = locationRef.current.value.trim();
    const sana = sanaRef.current.value;
    const tel = telRef.current.value.trim();
    const summa = summaRef.current.value.trim();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(sana);
    inputDate.setHours(0, 0, 0, 0);

    const validationErrors = {
      fam: !fam,
      ism: !ism,
      location: !location,
      sana: !sana || inputDate > today,
      tel: tel.length !== 13 || !tel.startsWith('+998'),
      summa: !summa,
      baho: !baho,
    };

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      if (!sana || inputDate > today) {
        setErrorMsg("❌ Sana xato! Kelajak sanani kiritmang.");
      } else if (tel.length !== 13 || !tel.startsWith('+998')) {
        setErrorMsg("❌ Telefon raqami to‘liq emas! +998 bilan boshlanishi va 13 ta belgidan iborat bo‘lishi kerak.");
      } else if (!baho) {
        setErrorMsg("❌ Iltimos, mijozga baho bering!");
      } else {
        setErrorMsg("❌ Ma'lumotlar to‘liq kiritilmagan!");
      }
      setSuccessMsg('');
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/users/register", {
        firstname: ism,
        lastname: fam,
        location: location,
        sana: sana,
        phonenumber: tel,
        summa: summa,
        baho: baho,
        isactive: true,
      });

      if (res.data.success) {
        setSuccessMsg("✅ Mijoz muvaffaqiyatli saqlandi!");
        setErrorMsg('');
        setErrors({});
        famRef.current.value = '';
        ismRef.current.value = '';
        locationRef.current.value = '';
        sanaRef.current.value = '';
        telRef.current.value = '';
        summaRef.current.value = '';
        setBaho(null); // baho tozalanmoqda
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "❌ Server xatosi! Ma'lumot yuborilmadi.";
      setErrorMsg(msg);
      setSuccessMsg('');
    }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      if (e.target.value.trim() !== '' && nextRef?.current) {
        nextRef.current.focus();
      } else {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="yangi-mijoz-container">
      <h1 className="yangi-title">➕ Yangi Mijoz.😊</h1>
      <p className="yangi-subtitle">Ma'lumotlarni to‘ldiring va saqlang.😊</p>

      {successMsg && <div className="yangi-success">{successMsg}</div>}
      {errorMsg && <div className="yangi-error">{errorMsg}</div>}

      <div className="yangi-form">
        <input
          type="text"
          placeholder="Familyasi"
          ref={famRef}
          className={`yangi-input ${errors.fam ? 'yangi-error-input' : ''}`}
          onKeyDown={(e) => handleKeyDown(e, ismRef)}
        />
        <input
          type="text"
          placeholder="Ismi"
          ref={ismRef}
          className={`yangi-input ${errors.ism ? 'yangi-error-input' : ''}`}
          onKeyDown={(e) => handleKeyDown(e, locationRef)}
        />
        <input
          type="text"
          placeholder="Qayerdan"
          ref={locationRef}
          className={`yangi-input ${errors.location ? 'yangi-error-input' : ''}`}
          onKeyDown={(e) => handleKeyDown(e, sanaRef)}
        />
        <label className="yangi-label">Qachon ketgan:</label>
        <input
          type="date"
          ref={sanaRef}
          className={`yangi-input ${errors.sana ? 'yangi-error-input' : ''}`}
          max={new Date().toISOString().split('T')[0]}
          onKeyDown={(e) => handleKeyDown(e, telRef)}
        />
        <input
          type="text"
          placeholder="Telefon raqami (+998...)"
          ref={telRef}
          maxLength={13}
          className={`yangi-input ${errors.tel ? 'yangi-error-input' : ''}`}
          onKeyDown={(e) => handleKeyDown(e, summaRef)}
        />
        <input
          type="text"
          placeholder="Qanchaga ketgan"
          ref={summaRef}
          className={`yangi-input ${errors.summa ? 'yangi-error-input' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.target.value.trim() !== '') handleSave();
              else e.preventDefault();
            }
          }}
        />

        <h3>Mijozni qanday baxolaysiz:</h3>
        <div className="baho-group">
          <label>
            <input
              type="radio"
              name="baho"
              value="yashil"
              checked={baho === 'yashil'}
              onChange={(e) => setBaho(e.target.value)}
            /> Yashil
          </label>
          <label>
            <input
              type="radio"
              name="baho"
              value="sariq"
              checked={baho === 'sariq'}
              onChange={(e) => setBaho(e.target.value)}
            /> Sariq
          </label>
          <label>
            <input
              type="radio"
              name="baho"
              value="qizil"
              checked={baho === 'qizil'}
              onChange={(e) => setBaho(e.target.value)}
            /> Qizil
          </label>
        </div>

        <button className="yangi-btn" onClick={handleSave}>💾 Saqlash</button>
        <button className="yangi-btn-secondary" onClick={() => navigate('/')}>
          ⬅️ Asosiy sahifa
        </button>
        <button className="yangi-btn-secondary" onClick={() => navigate('/mijozlarRoyxati')}>
          📋 Mijozlar ro‘yxati
        </button>
      </div>
    </div>
  );
}

export default YangiMijoz;
