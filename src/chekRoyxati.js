import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './chekRoyxati.css';

export default function ChekRoyxati() {
  const [cheklar, setCheklar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const componentRef = useRef();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const numberToWordsUzbek = (num) => {
    const ones = ['', 'bir', 'ikki', 'uch', 'to‘rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to‘qqiz'];
    const tens = ['', '', 'yigirma', 'o‘ttiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'to‘qson'];
    const teens = ['o‘n', 'o‘n bir', 'o‘n ikki', 'o‘n uch', 'o‘n to‘rt', 'o‘n besh', 'o‘n olti', 'o‘n yetti', 'o‘n sakkiz', 'o‘n to‘qqiz'];
    const thousands = ['', 'ming', 'million', 'milliard'];

    if (num === 0) return 'nol';

    const chunkToWords = (n) => {
      let str = '';
      const hundred = Math.floor(n / 100);
      const rest = n % 100;

      if (hundred) str += ones[hundred] + ' yuz ';
      if (rest >= 10 && rest < 20) str += teens[rest - 10] + ' ';
      else {
        const ten = Math.floor(rest / 10);
        const one = rest % 10;
        if (ten) str += tens[ten] + ' ';
        if (one) str += ones[one] + ' ';
      }
      return str.trim();
    };

    const parts = [];
    let i = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk) {
        const chunkWords = chunkToWords(chunk);
        parts.unshift(chunkWords + (thousands[i] ? ' ' + thousands[i] : ''));
      }
      num = Math.floor(num / 1000);
      i++;
    }

    return parts.join(' ').trim() + ' so‘m';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('https://risola-backend.onrender.com/userKvitansiya/getUsers');
        if (res.data.success) {
          const enrichedData = res.data.data.map(item => ({
            ...item,
            sumInWords: numberToWordsUzbek(Number(item.summa || 0))
          }));
          setCheklar(enrichedData);
          setError('');
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        setError("Server bilan bog'lanishda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowPasswordModal(true);
  };

  const confirmDelete = async () => {
    const secretCode = '1234';
    if (passwordInput !== secretCode) {
      alert("❌ Noto‘g‘ri kod!");
      return;
    }

    try {
      await axios.delete(`https://risola-backend.onrender.com/userKvitansiya/delete/${deleteId}`);
      setCheklar(prev => prev.filter(item => item._id !== deleteId));
      alert("✅ Kvitansiya muvaffaqiyatli o‘chirildi.");
    } catch (err) {
      alert("❌ O‘chirishda xatolik yuz berdi.");
    } finally {
      setShowPasswordModal(false);
      setPasswordInput('');
      setDeleteId(null);
    }
  };

  useEffect(() => {
    const generatePDF = async () => {
      if (!selectedItem) return;
      await new Promise(resolve => setTimeout(resolve, 200));
      const input = componentRef.current;
      if (!input) return;
      try {
        const canvas = await html2canvas(input);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`kvitansiya_${selectedItem.tartibraqam || selectedItem._id}.pdf`);
      } catch (error) {
        console.error('PDF yaratishda xatolik:', error);
      } finally {
        setSelectedItem(null);
      }
    };

    generatePDF();
  }, [selectedItem]);

  const handleDownload = (item) => {
    setSelectedItem(item);
  };

  const filteredData = cheklar.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.fullname?.toLowerCase().includes(term) ||
      item.phonenumber?.toLowerCase().includes(term) ||
      item.tartibraqam?.toLowerCase().includes(term) ||
      item.location?.toLowerCase().includes(term)
    );
  });

  const totalPeople = filteredData.reduce((sum, item) => sum + Number(item.amountpeople || 0), 0);

  return (
    <div className="cheklar-wrapper">
      <h1>Cheklar ro‘yxati</h1>

      <div className="action-buttons">
        <div className="button-group">
          <button onClick={() => navigate('/')}>Asosiy sahifaga</button>
          <button onClick={() => navigate('/kvitansiya')}>Yangi kvitansiya</button>
        </div>
        <input
          type="search"
          className="search-input"
          placeholder="🔍 Qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="summary-box">
        <p><strong>Jami kvitansiyalar:</strong> {filteredData.length} ta</p>
        <p><strong>Jami insonlar soni:</strong> {totalPeople} nafar</p>
      </div>

      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div className="table-container">
          <table className="cheklar-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Uchish sanasi</th>
                <th>Ism Familya</th>
                <th>Telefon</th>
                <th>Yashash manzili</th>
                <th>To‘lov summasi</th>
                <th>Necha kishiga</th>
                <th>Qo‘shimcha to‘lov</th>
                <th>Qo‘shimcha xona</th>
                <th>Tartib raqami</th>
                <th>Chek sanasi</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item.sana?.slice(0, 10)}</td>
                  <td>{item.fullname}</td>
                  <td>{item.phonenumber}</td>
                  <td>{item.location}</td>
                  <td>{Number(item.summa || 0).toLocaleString()} so‘m</td>
                  <td>{item.amountpeople}</td>
                  <td>{Number(item.qoshimchatolov || 0).toLocaleString()} so‘m</td>
                  <td>{item.amountroom || '-'}</td>
                  <td>{item.tartibraqam}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <button className="delete" onClick={() => handleDelete(item._id)}>O‘chirish</button>
                    <button onClick={() => handleDownload(item)}>Yuklash</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Maxfiy kodni kiriting:</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Parol..."
              className="password-input"
            />
            <div className="modal-buttons">
              <button onClick={confirmDelete}>Tasdiqlash</button>
              <button onClick={() => {
                setShowPasswordModal(false);
                setPasswordInput('');
                setDeleteId(null);
              }}>Bekor qilish</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {selectedItem && (
          <div ref={componentRef} className="containerKvitansiya">
            {/* PDF uchun kvitansiya ko‘rinishi */}
             <div className="firstDiv">
              <h1>{formatDate(selectedItem.createdAt)}</h1>
              <h1>Naqd pul haqida Kvitansiya</h1>
              <h1 className='inputCircle'>№ {selectedItem.tartibraqam}</h1>
            </div>
            <div className="secondDiv">
              <h2>Uchish sanasi</h2>
              <h2 className='inputCircle'>{formatDate(selectedItem.sana)}</h2>
              <h2>To'lov maqsadi</h2>
              <h2>Umra hizmati</h2>
            </div>
            <div className="thridDiv">
              <h2>Kim tomonidan to'lov qilindi</h2>
              <h2 className='inputCircle'>{selectedItem.fullname}</h2>
              <h2>Necha kishiga to‘lov qilindi</h2>
              <h3 className='inputCircle'>{selectedItem.amountpeople}</h3>
            </div>
            <div className="fourthDiv">
              <h2>Pulni qabul qiluvchi subyekt</h2>
              <h2>"Risola Travel Lux" MCHJ</h2>
              <h2 className='inputCircle'>{selectedItem.phonenumber}</h2>
            </div>
            <div className="fivethDiv">
              <div className="summaDiv">
                <h2>So'z bilan yozilgan summa</h2>
                <p>{selectedItem.sumInWords}</p>
              </div>
              <h2 className='inputCircle'>{selectedItem.location}</h2>
              <h2 className='inputCircle'>{Number(selectedItem.summa || 0).toLocaleString()} so‘m</h2>
            </div>
            <div className="sixthDiv">
              <h2>Qo'shimcha to'lov alohida xona uchun</h2>
              <h2 className='inputCircle'>{selectedItem.amountroom || '-'}</h2>
              <h2 className='inputCircle'>{Number(selectedItem.qoshimchatolov || 0).toLocaleString()} so‘m</h2>
            </div>
          </div>
          
        )}
      </div>
    </div>
  );
}
