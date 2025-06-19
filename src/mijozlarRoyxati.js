import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './mijozlarRoyxati.css';

function MijozlarRoyxati() {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const queryParams = new URLSearchParams(locationHook.search);
  const oy = queryParams.get('oy');

  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [locationStats, setLocationStats] = useState({});
  const [totalSumma, setTotalSumma] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const tumans = useMemo(() => ([
    'kosonsoy', 'mingbuloq', 'namangan shahar', 'norin', 'pop', 'toʻraqoʻrgʻon',
    'uychi', 'uchqoʻrgʻon', 'chortoq', 'chust', 'yangiqoʻrgʻon'
  ]), []);

  const capitalizeWords = (str) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    axios.get("https://backend-rislola.onrender.com/api/users/getUsers")
      .then(res => {
        const allUsers = res.data.data;
        let filtered = allUsers;

        if (oy) {
          const oyMap = {
            yanvar: '01', fevral: '02', mart: '03', aprel: '04',
            may: '05', iyun: '06', iyul: '07', avgust: '08',
            sentabr: '09', oktabr: '10', noyabr: '11', dekabr: '12'
          };
          const oyRaqami = oyMap[oy.toLowerCase()];
          filtered = allUsers.filter(user => user.sana?.slice(5, 7) === oyRaqami);
        }

        setUsers(filtered);
        setFilteredUsers(filtered);
        setTotalSumma(filtered.reduce((sum, user) => sum + (parseFloat(user.summa) || 0), 0));

        const stats = {};
        tumans.forEach(t => {
          stats[t] = filtered.filter(user => user.location?.toLowerCase().trim() === t).length;
        });
        setLocationStats(stats);
      })
      .catch(err => console.error("❌ Ma'lumot olishda xato:", err));
  }, [oy, tumans]);

  const oylarStatistikasi = useMemo(() => {
    const oylar = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const stats = Array(12).fill(0);

    users.forEach(user => {
      if (user.sana) {
        const oy = new Date(user.sana).getMonth();
        stats[oy]++;
      }
    });

    return oylar.map((nom, index) => ({
      nom,
      soni: stats[index]
    }));
  }, [users]);

  const handleEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      location: user.location,
      phonenumber: user.phonenumber,
      sana: user.sana?.slice(0, 10),
      summa: user.summa,
      baho: user.baho || ''
    });
  };

  const handleSave = () => {
    if (!formData.firstname || !formData.lastname || !formData.phonenumber || !formData.sana || !formData.summa || !formData.location) {
      alert("❌ Barcha maydonlar to‘ldirilishi shart!");
      return;
    }

    axios.put(`https://backend-rislola.onrender.com/api/users/updateUsersById/${editingUserId}`, formData)
      .then(res => {
        const updatedUsers = users.map(user =>
          user._id === editingUserId ? res.data.data : user
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setEditingUserId(null);
        setTotalSumma(updatedUsers.reduce((sum, user) => sum + (parseFloat(user.summa) || 0), 0));

        const stats = {};
        tumans.forEach(t => {
          stats[t] = updatedUsers.filter(user => user.location?.toLowerCase().trim() === t).length;
        });
        setLocationStats(stats);
        alert("✅ Mijoz ma'lumotlari yangilandi.");
      })
      .catch(err => {
        console.error("❌ Yangilashda xatolik:", err);
        alert("❌ Saqlashda xato yuz berdi.");
      });
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setFormData({});
  };

  const handleDel = (user) => {
    if (window.confirm("❗ Bu mijozni o‘chirishga ishonchingiz komilmi?")) {
      axios.delete(`https://backend-rislola.onrender.com/api/users/delete/${user._id}`)
        .then(() => {
          const updatedUsers = users.filter(u => u._id !== user._id);
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);
          setTotalSumma(updatedUsers.reduce((sum, user) => sum + (parseFloat(user.summa) || 0), 0));

          const stats = {};
          tumans.forEach(t => {
            stats[t] = updatedUsers.filter(user => user.location?.toLowerCase().trim() === t).length;
          });
          setLocationStats(stats);
        })
        .catch(err => {
          console.error("❌ O‘chirishda xato:", err);
          alert("❌ O‘chirishda xatolik yuz berdi.");
        });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setFilteredUsers(users);
      setSearchMessage('');
      setTotalSumma(users.reduce((sum, user) => sum + (parseFloat(user.summa) || 0), 0));
      return;
    }

    const matched = users.filter(user =>
      user.firstname?.toLowerCase().includes(term) ||
      user.lastname?.toLowerCase().includes(term) ||
      user.phonenumber?.includes(term) ||
      user.location?.toLowerCase().includes(term)
    );

    setFilteredUsers(matched);
    setTotalSumma(matched.reduce((sum, user) => sum + (parseFloat(user.summa) || 0), 0));
    setSearchMessage(matched.length ? `✅ Topildi: ${matched.length} ta` : "❌ Bunday mijoz topilmadi.");
  };

  const formatSumma = (value) => {
    const num = parseFloat(value?.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? value : new Intl.NumberFormat('en-US').format(num) + ' $';
  };

  const getBahoStyle = (baho) => {
    switch (baho) {
      case 'yashil':
        return { color: 'green', fontWeight: 'bold' };
      case 'sariq':
        return { color: 'orange', fontWeight: 'bold' };
      case 'qizil':
        return { color: 'red', fontWeight: 'bold' };
      default:
        return {};
    }
  };

  return (
    <div className="mijozlar-layout">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? '✖' : '☰'}
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>📍 Tumanlar bo‘yicha mijozlar soni:</h2>
        <ul>
          {tumans.map(tuman => (
            <li key={tuman}>
              {capitalizeWords(tuman)}: {locationStats[tuman] || 0} ta
            </li>
          ))}
        </ul>

        <hr />
        <h2>📆 Oylar bo‘yicha mijozlar soni:</h2>
        <ul>
          {oylarStatistikasi.map((oy, index) => (
            <li key={index}>
              {oy.nom}: {oy.soni} ta
            </li>
          ))}
        </ul>
      </div>

      <div className="mijozlar-royxati">
        <h1>{oy ? `📅 ${oy.charAt(0).toUpperCase() + oy.slice(1)} oyidagi mijozlar` : "Mijozlar ro'yxati"}</h1>

        <div className="top-controls">
          <div className="jami-son">Jami mijozlar: <strong>{filteredUsers.length}</strong></div>
          <div className="jami-summa">Umumiy summa: <strong>{formatSumma(totalSumma)}</strong></div>
          <input
            type="search"
            placeholder="🔍 Qidirish"
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        {searchMessage && <div className="search-message">{searchMessage}</div>}

        <table className="mijoz-table">
          <thead>
            <tr>
              <th>#</th>
              <th>F.I.Sh</th>
              <th>Yashash manzili</th>
              <th>Telefon</th>
              <th>Sana</th>
              <th>Summa</th>
              <th>Baho</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td style={getBahoStyle(user.baho)}>
                  {editingUserId === user._id ? (
                    <>
                      <input name="lastname" value={formData.lastname || ''} onChange={handleChange} />
                      <input name="firstname" value={formData.firstname || ''} onChange={handleChange} />
                    </>
                  ) : (
                    `${user.lastname} ${user.firstname}`
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <input name="location" value={formData.location || ''} onChange={handleChange} />
                  ) : (
                    user.location
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <input name="phonenumber" value={formData.phonenumber || ''} onChange={handleChange} />
                  ) : (
                    user.phonenumber
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <input type="date" name="sana" value={formData.sana || ''} onChange={handleChange} />
                  ) : (
                    user.sana?.slice(0, 10)
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <input name="summa" value={formData.summa || ''} onChange={handleChange} />
                  ) : (
                    formatSumma(user.summa)
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <select name="baho" value={formData.baho || ''} onChange={handleChange}>
                      <option value="">Tanlang</option>
                      <option value="yashil">Yashil</option>
                      <option value="sariq">Sariq</option>
                      <option value="qizil">Qizil</option>
                    </select>
                  ) : (
                    user.baho || "–"
                  )}
                </td>
                <td>
                  {editingUserId === user._id ? (
                    <>
                      <button onClick={handleSave}>Saqlash</button>
                      <button onClick={handleCancel}>Bekor</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(user)}>✏️ Tahrirlash</button>
                      <button onClick={() => handleDel(user)}>🗑️ O‘chirish</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="back-button" onClick={() => navigate('/')}>⬅️ Asosiy sahifaga qaytish</button>
      </div>
    </div>
  );
}

export default MijozlarRoyxati;
