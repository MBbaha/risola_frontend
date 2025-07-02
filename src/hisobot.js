import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './hisobot.css';

const tumans = [
  'kosonsoy', 'mingbuloq', 'namangan sh', 'norin', 'pop', 'toʻraqoʻrgʻon',
  'uychi', 'uchqoʻrgʻon', 'chortoq', 'chust', 'yangiqoʻrgʻon',"namangan t"
];

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

const HisobotDashboard = () => {
  const [users, setUsers] = useState([]);
  const [reportRange, setReportRange] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://backend-rislola.onrender.com/api/users/getUsers')
      .then(res => setUsers(res.data.data))
      .catch(err => console.error("Xatolik:", err));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const filterByMonths = (monthsAgo) => {
      const fromDate = new Date(now);
      fromDate.setMonth(now.getMonth() - monthsAgo);
      return users.filter(user => new Date(user.sana) >= fromDate);
    };

    const prevStats = {};
    const currentStats = {};

    tumans.forEach(t => {
      prevStats[t] = 0;
      currentStats[t] = 0;
    });

    const currentUsers = filterByMonths(reportRange);
    const previousUsers = users.filter(user => {
      const date = new Date(user.sana);
      const from = new Date(now);
      const to = new Date(now);
      from.setMonth(now.getMonth() - (reportRange * 2));
      to.setMonth(now.getMonth() - reportRange);
      return date >= from && date < to;
    });

    currentUsers.forEach(u => {
      const loc = u.location?.toLowerCase().trim();
      if (currentStats[loc] !== undefined) currentStats[loc]++;
    });

    previousUsers.forEach(u => {
      const loc = u.location?.toLowerCase().trim();
      if (prevStats[loc] !== undefined) prevStats[loc]++;
    });

    const pieDataCurrent = tumans.map((t) => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      value: currentStats[t]
    })).filter(d => d.value > 0);

    const pieDataPrevious = tumans.map((t) => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      value: prevStats[t]
    })).filter(d => d.value > 0);

    const bahoCounts = {
      yashil: 0,
      sariq: 0,
      qizil: 0
    };

    currentUsers.forEach(u => {
      const b = u.baho?.toLowerCase();
      if (bahoCounts[b] !== undefined) {
        bahoCounts[b]++;
      }
    });

    const details = pieDataCurrent.map(item => `- ${item.name}: ${item.value} ta mijoz`).join("\n");

    return {
      pieDataCurrent,
      pieDataPrevious,
      jami: currentUsers.length,
      bahoCounts,
      pdfDetails: `So'nggi ${reportRange} oy ichida tumanlar kesimida qo'shilgan mijozlar:\n\n${details}\n\nJami yangi mijozlar: ${currentUsers.length} ta.\n\nBaholar:\n🟢 Yashil: ${bahoCounts.yashil} ta\n🟡 Sariq: ${bahoCounts.sariq} ta\n🔴 Qizil: ${bahoCounts.qizil} ta`
    };
  }, [users, reportRange]);

  const handleDownload = () => {
    const reportElement = document.getElementById("report-content");
    html2canvas(reportElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Hisobot_${reportRange}_oylik.pdf`);
    });
  };

  const renderCustomizedLabel = ({ percent }) => `${(percent * 100).toFixed(1)}%`;

  return (
    <div className="hisobot-container">
      <div id="report-content" className="report-box">
        <h1 className="report-title">📊 So‘nggi {reportRange} oylik tumanlar kesimidagi hisobot</h1>

        <div className="radio-group">
          <label><input type="radio" name="range" value={3} checked={reportRange === 3} onChange={() => setReportRange(3)} /> 3 oy</label>
          <label><input type="radio" name="range" value={6} checked={reportRange === 6} onChange={() => setReportRange(6)} /> 6 oy</label>
          <label><input type="radio" name="range" value={12} checked={reportRange === 12} onChange={() => setReportRange(12)} /> 12 oy</label>
        </div>

        <h2 className="summary-text">✅ Jami yangi mijozlar: {stats.jami} ta</h2>

        <div className="baho-summary">
          <p>🟢 Yashil: {stats.bahoCounts.yashil} ta</p>
          <p>🟡 Sariq: {stats.bahoCounts.sariq} ta</p>
          <p>🔴 Qizil: {stats.bahoCounts.qizil} ta</p>
        </div>

        <div className="pie-wrapper">
          <div className="pie-chart-box">
            <h3>📌 Hozirgi davr</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.pieDataCurrent}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderCustomizedLabel}
                >
                  {stats.pieDataCurrent.map((entry, index) => (
                    <Cell key={`cell-current-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pie-chart-box">
            <h3>📌 Oldingi davr</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.pieDataPrevious}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={renderCustomizedLabel}
                >
                  {stats.pieDataPrevious.map((entry, index) => (
                    <Cell key={`cell-previous-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="download-btn" onClick={handleDownload}>⬇️ Hisobotni yuklab olish</button>
        <button className="back-btn" onClick={() => navigate('/')}>⬅️Asosiy sahifaga qaytish</button>
      </div>
    </div>
  );
};

export default HisobotDashboard;
