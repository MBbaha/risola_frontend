import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './kvitansiya.css';

function Kvitansiya() {
  const navigate = useNavigate();

  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const monthName = months[today.getMonth()];
  const formattedDate = `${day}-${monthName} ${year}-yil`;

  const initialForm = {
    fullname: '',
    phonenumber: '',
    sana: '',
    summa: '',
    tartibraqam: '',
    qoshimchatolov: '',
    amountpeople: '',
    amountroom: '',
    location: '',
    isactive: true
  };

  const [form, setForm] = useState(initialForm);
  const [sumInWords, setSumInWords] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrintButton, setShowPrintButton] = useState(false);

  // 🔄 Tartib raqamini avtomatik yuklash (oxirgi raqamga qarab +1)
  useEffect(() => {
    const fetchLastNumber = async () => {
      try {
        const res = await axios.get('https://backend-rislola.onrender.com/api/userKvitansiya/getUsers'); // backendga moslang
        const data = res.data;

        let nextNumber = '001';
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          const lastNum = parseInt(last.tartibraqam || '000', 10);
          nextNumber = (lastNum + 1).toString();
        }
        setForm(prev => ({ ...prev, tartibraqam: nextNumber }));
      } catch (err) {
        console.error("Tartib raqam olishda xatolik:", err.message);
        setForm(prev => ({ ...prev, tartibraqam: '001' })); // fallback
      }
    };
    fetchLastNumber();
  }, []);

  const formatNumber = val => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const numberToWordsUzbek = numStr => {
    const ones = ['', 'bir', 'ikki', 'uch', "to‘rt", 'besh', 'olti', 'yetti', 'sakkiz', "to‘qqiz"];
    const tens = ['', 'o‘n', 'yigirma', 'o‘ttiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'to‘qson'];
    const thousands = ['', 'ming', 'million', 'milliard'];

    const groups = numStr.replace(/\s/g, '').match(/\d{1,3}(?=(\d{3})*$)/g);
    if (!groups) return '';
    return groups.map((g, i) => {
      const n = parseInt(g, 10);
      if (n === 0) return '';
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      return [
        h ? ones[h] + ' yuz' : '',
        t ? tens[t] : '',
        o ? ones[o] : '',
        thousands[groups.length - 1 - i]
      ].filter(Boolean).join(' ');
    }).filter(Boolean).join(' ').trim() + ' so‘m';
  };

  const handleChange = e => {
    const { name, value } = e.target;
    let newVal = value;
    if (name === 'summa') {
      newVal = formatNumber(value);
      setSumInWords(numberToWordsUzbek(newVal));
    }
    if (name === 'qoshimchatolov') {
      newVal = formatNumber(value);
    }
    setForm(f => ({ ...f, [name]: newVal }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post('https://backend-rislola.onrender.com/api/userKvitansiya/register', {
        ...form,
        summa: form.summa.replace(/\s/g, ''),
        qoshimchatolov: form.qoshimchatolov.replace(/\s/g, '')
      });
      if (res.data.success) {
        setSuccessMsg("✅ Kvitansiya muvaffaqiyatli saqlandi!");
        setErrorMsg('');
        setShowPrintButton(true);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        throw new Error(res.data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "❌ Server xatosi!");
      setSuccessMsg('');
      setShowPrintButton(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {successMsg && <div className="alert success">{successMsg}</div>}
      {errorMsg && <div className="alert error">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="containerKvitansiya">
        <div className="firstDiv">
          <h1>{formattedDate}</h1>
          <h1>Naqd pul haqida Kvitansiya</h1>
          <h1>№ {form.tartibraqam}</h1>
        </div>

        <div className="secondDiv">
          <h2>Uchish sanasi</h2>
          <h2><input name="sana" type="date" value={form.sana} onChange={handleChange} required /></h2>
          <h2>To'lov maqsadi</h2>
          <h2>Umra hizmati</h2>
        </div>

        <div className="thridDiv">
          <h2>Kim tomonidan to'lov qilindi</h2>
          <h2><input name="fullname" placeholder="Ism Familya" value={form.fullname} onChange={handleChange} required /></h2>
          <h2>Necha kishiga to‘lov qilindi</h2>
          <h3><input name="amountpeople" type="number" value={form.amountpeople} onChange={handleChange} required /></h3>
        </div>

        <div className="fourthDiv">
          <h2>Pulni qabul qiluvchi subyekt</h2>
          <h2>"Risola Travel Lux" MCHJ</h2>
          <input name="phonenumber" placeholder="Telefon raqami" value={form.phonenumber} onChange={handleChange} required />
        </div>

        <div className="fivethDiv">
          <div className="summaDiv">
            <h2>So'z bilan yozilgan summa</h2>
            <p style={{ fontWeight: 'bold' }}>{sumInWords}</p>
          </div>
          <h2><input name="location" placeholder="Qayerdan" value={form.location} onChange={handleChange} required /></h2>
          <h2>
            <input
              name="summa"
              value={form.summa}
              onChange={handleChange}
              placeholder="Summani kiriting"
              style={{ textAlign: 'center', marginLeft: 20 }}
              required
            />
          </h2>
        </div>

        <div className="sixthDiv">
          <h2>Qo'shimcha to'lov alohida xona uchun</h2>
          <h2><input name="amountroom" style={{ width: 40 }} value={form.amountroom} onChange={handleChange} /></h2>
          <h2>
            <input
              name="qoshimchatolov"
              value={form.qoshimchatolov}
              onChange={handleChange}
              placeholder="Qo‘shimcha to‘lov"
              style={{ textAlign: 'center' }}
            />
          </h2>
        </div>

        <div className="seventhDiv" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '6px 16px', fontSize: 14, backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            {loading ? 'Yuklanmoqda...' : 'Saqlash'}
          </button>

          {showPrintButton && (
            <button
              type="button"
              onClick={handlePrint}
              style={{ padding: '6px 16px', fontSize: 14, backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 6 }}
            >
              Chop etish
            </button>
          )}
        </div>
      </form>

      <div className="footerButton">
        <button className="back-button" onClick={() => navigate('/')}>Asosiy sahifaga qaytish</button>
        <button className="back-button" onClick={() => navigate('/chekRoyxati')}>Cheklar ro‘yxatini ko‘rish</button>
      </div>
    </div>
  );
}

export default Kvitansiya;
