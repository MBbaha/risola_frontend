import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';          // npm i qrcode.react
import './App.css';
import './kvitansiya.css';
import logo from './assets/risola-logo.png';      // logotip shu yerda bo'lishi kerak

const API = 'https://backendrisola-production.up.railway.app';

const KASSIRLAR = {
  Baxtiyor: 'Atamirzayev Baxtiyor',
  Abdugani: 'Qahharov Abdugani',
  Bositxon: 'Saydullayev Bositxon',
};

const KURS_NOMI = {
  sell: 'Kapitalbank (sotish)',
  buy: 'Kapitalbank (sotib olish)',
  cb: 'Markaziy bank',
  xalqaro: 'Xalqaro kurs',
  manual: "Qo'lda kiritilgan",
};

// Qo'lda kiritilgan kurs shu kompyuterda kun oxirigacha eslab qolinadi
const QOLDA_KEY = 'kv-qolda-kurs';
const qoldaOqish = sana => {
  try {
    const s = JSON.parse(localStorage.getItem(QOLDA_KEY) || 'null');
    return s && s.sana === sana ? s.kurs : '';
  } catch { return ''; }
};
const qoldaYozish = (sana, kurs) => {
  try { localStorage.setItem(QOLDA_KEY, JSON.stringify({ sana, kurs })); } catch { /* e'tiborsiz */ }
};

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

/* ---------- yordamchi funksiyalar ---------- */
const pad = n => String(n).padStart(2, '0');
const digits = s => String(s ?? '').replace(/\D/g, '');
const groupInt = s => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const parseUzs = s => Number(digits(s)) || 0;
const parseDec = s => parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
const fmtUzs = n => groupInt(String(Math.round(n)));
const fmtDec = n => {
  const [i, d] = Number(n).toFixed(2).split('.');
  return `${groupInt(i)}.${d}`;
};
// "1 234.5" kabi kasrli yozuvni tozalaydi (vergul ham nuqta deb olinadi)
const cleanDecInput = v => {
  const s = String(v).replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [i, ...rest] = s.split('.');
  return rest.length ? `${groupInt(i)}.${rest.join('').slice(0, 2)}` : groupInt(i);
};
const fromUzs = (summa, rate) => (parseUzs(summa) && rate ? fmtDec(parseUzs(summa) / rate) : '');
const fromUsd = (usd, rate) => (parseDec(usd) && rate ? fmtUzs(parseDec(usd) * rate) : '');
const formatSana = s => (s ? s.split('-').reverse().join('.') : '');
const newNumber = () => String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');

const numberToWordsUzbek = numStr => {
  if (!parseUzs(numStr)) return '';
  const ones = ['', 'bir', 'ikki', 'uch', "to'rt", 'besh', 'olti', 'yetti', 'sakkiz', "to'qqiz"];
  const tens = ['', "o'n", 'yigirma', "o'ttiz", 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', "to'qson"];
  const thousands = ['', 'ming', 'million', 'milliard'];
  const groups = digits(numStr).match(/\d{1,3}(?=(\d{3})*$)/g);
  if (!groups) return '';
  return groups.map((g, i) => {
    const n = parseInt(g, 10);
    if (n === 0) return '';
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
    return [h ? ones[h] + ' yuz' : '', t ? tens[t] : '', o ? ones[o] : '', thousands[groups.length - 1 - i]]
      .filter(Boolean).join(' ');
  }).filter(Boolean).join(' ').trim() + " so'm";
};

/* ---------- himoya foni (guilloche) — bank qog'ozidagi to'lqinli chiziqlar ---------- */
const GUILLOCHE = (() => {
  const W = 1000, H = 420, paths = [];
  const wave = (k, amp, freq, phase, base) => {
    let d = '';
    for (let x = 0; x <= W; x += 8) {
      const y = base + amp * Math.sin(x * freq + phase + k * 0.33) + (amp / 3) * Math.sin(x * freq * 2.7 + k);
      d += `${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)} `;
    }
    return d;
  };
  for (let k = 0; k < 22; k++) paths.push(wave(k, 26, 0.011, 0, 40 + k * 16));
  for (let k = 0; k < 22; k++) paths.push(wave(k, 22, 0.009, Math.PI, 30 + k * 17));
  // rozetka — to'lqinli konsentrik halqalar (300x300 maydonda)
  let r = '';
  const N = 720;
  for (let j = 0; j < 16; j++) {
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const rad = 34 + j * 7 + 9 * Math.sin(24 * t + j * 0.55);
      const x = 150 + rad * Math.cos(t), y = 150 + rad * Math.sin(t);
      r += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
    }
  }
  return { W, H, paths, rosette: r };
})();

function Guilloche({ rosette = false }) {
  return (
    <>
      <svg className="kv-guilloche" viewBox={`0 0 ${GUILLOCHE.W} ${GUILLOCHE.H}`} preserveAspectRatio="none" aria-hidden="true">
        {GUILLOCHE.paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
      {rosette && (
        <svg className="kv-rosette" viewBox="0 0 300 300" aria-hidden="true">
          <path d={GUILLOCHE.rosette} />
        </svg>
      )}
    </>
  );
}

/* ================================================================== */

function Kvitansiya() {
  const navigate = useNavigate();

  const today = new Date();
  const shortDate = `${pad(today.getDate())}.${pad(today.getMonth() + 1)}.${today.getFullYear()}`;
  const longDate = `${today.getDate()}-${MONTHS[today.getMonth()]} ${today.getFullYear()}-yil`;
  const timeNow = `${pad(today.getHours())}:${pad(today.getMinutes())}`;

  const initialForm = {
    fullname: '',
    phonenumber: '',
    sana: '',
    summa: '',
    tartibraqam: '',
    kvitansiyakod: '',   // Chek ID
    kassir: 'Baxtiyor',
    qoshimchatolov: '',
    amountpeople: '',
    amountroom: '',
    location: '',
    dollar: '',          // summaning dollardagi qiymati
    isactive: true,
  };

  const [form, setForm] = useState(initialForm);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ----- dollar kursi ----- */
  const [kursData, setKursData] = useState(null);
  const [kursHolat, setKursHolat] = useState('loading'); // loading | ok | error
  const [kursTuri, setKursTuri] = useState('sell');      // sell | buy | cb | manual
  const [qoldaKurs, setQoldaKurs] = useState('');
  const lastEdited = useRef('uzs');                      // oxirgi yozilgan: 'uzs' yoki 'usd'

  useEffect(() => {
    setForm(prev => ({ ...prev, tartibraqam: newNumber() }));
    const bugungi = qoldaOqish(shortDate);          // bugun qo'lda kiritilgan kurs bo'lsa
    if (bugungi) { setQoldaKurs(bugungi); setKursTuri('manual'); }
    fetchKurs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKurs = async (yangi) => {
    setKursHolat('loading');
    try {
      const { data } = await axios.get(`${API}/api/kurs${yangi ? '?yangi=1' : ''}`, { timeout: 30000 });
      if (!data.ok) throw new Error(data.message);
      setKursData(data);
      setKursHolat('ok');
      // tanlangan kurs mavjud bo'lmasa — eng yaxshi mavjudiga o'tadi
      const bor = t => (t === 'sell' || t === 'buy' ? !!data.kapitalbank : t === 'cb' ? !!data.cb : t === 'xalqaro' ? !!data.xalqaro : true);
      setKursTuri(t => (t === 'manual' || bor(t) ? t : data.kapitalbank ? 'sell' : data.cb ? 'cb' : 'xalqaro'));
    } catch (e) {
      setKursHolat('error');
      setKursTuri(t => (t === 'manual' ? t : kursData ? t : 'manual'));
    }
  };

  const kursQiymat = type => {
    if (!kursData) return 0;
    if (type === 'sell') return kursData.kapitalbank?.sell || 0;
    if (type === 'buy') return kursData.kapitalbank?.buy || 0;
    if (type === 'cb') return kursData.cb || 0;
    if (type === 'xalqaro') return kursData.xalqaro || 0;
    return 0;
  };

  const rate = kursTuri === 'manual' ? parseDec(qoldaKurs) : kursQiymat(kursTuri);
  const kursSana =
    kursTuri === 'cb' ? (kursData?.cbSana || shortDate)
    : kursTuri === 'xalqaro' ? (kursData?.xalqaroSana || shortDate)
    : shortDate;
  const kursManba = KURS_NOMI[kursTuri];

  // kurs o'zgarsa — oxirgi yozilgan qiymatdan qayta hisoblash
  useEffect(() => {
    if (!rate || saved) return;
    setForm(f =>
      lastEdited.current === 'usd'
        ? { ...f, summa: fromUsd(f.dollar, rate) || f.summa }
        : { ...f, dollar: fromUzs(f.summa, rate) || f.dollar }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate]);

  const sumInWords = useMemo(() => numberToWordsUzbek(form.summa), [form.summa]);

  /* ----- input hodisalari ----- */
  const handlePhone = e => {
    let value = digits(e.target.value);
    if (value.length > 2 && value.length <= 5) value = value.replace(/(\d{2})(\d+)/, '$1 $2');
    else if (value.length > 5 && value.length <= 7) value = value.replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3');
    else if (value.length > 7) value = value.replace(/(\d{2})(\d{3})(\d{2})(\d+)/, '$1 $2 $3 $4');
    setForm(f => ({ ...f, phonenumber: value }));
  };

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'summa') {                       // so'm yozildi → dollar hisoblanadi
      const summa = groupInt(digits(value));
      lastEdited.current = 'uzs';
      setForm(f => ({ ...f, summa, dollar: rate ? fromUzs(summa, rate) : f.dollar }));
      return;
    }
    if (name === 'dollar') {                      // dollar yozildi → so'm hisoblanadi
      const dollar = cleanDecInput(value);
      lastEdited.current = 'usd';
      setForm(f => ({ ...f, dollar, summa: rate ? fromUsd(dollar, rate) : f.summa }));
      return;
    }

    let newVal = value;
    if (name === 'qoshimchatolov') newVal = groupInt(digits(value));
    if (name === 'amountpeople' || name === 'amountroom') newVal = digits(value).slice(0, 3);
    if (name === 'kvitansiyakod') newVal = value.toUpperCase().replace(/\s+/g, '');
    setForm(f => ({ ...f, [name]: newVal }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading || saved) return;
    if (!parseUzs(form.summa)) {
      setErrorMsg("Summani kiriting.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/userKvitansiya/register`, {
        ...form,
        summa: digits(form.summa),
        qoshimchatolov: digits(form.qoshimchatolov) || '0',
        amountroom: form.amountroom || '0',
        dollar: parseDec(form.dollar).toFixed(2),
        kurs: rate ? String(rate) : '',
        kursmanba: rate ? `${kursManba}, ${kursSana}` : '',
      });
      if (res.data.success) {
        setSuccessMsg("✅ Kvitansiya saqlandi. Endi chop etishingiz mumkin.");
        setErrorMsg('');
        setSaved(true);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        throw new Error(res.data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "❌ Server xatosi!");
      setSuccessMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setForm({ ...initialForm, kassir: form.kassir, tartibraqam: newNumber() });
    lastEdited.current = 'uzs';
    setSaved(false);
    setErrorMsg('');
  };

  /* ----- chekda ko'rinadigan qiymatlar ----- */
  const kassirIsm = KASSIRLAR[form.kassir];
  const chekId = form.kvitansiyakod || '—';
  const summaPrint = form.summa ? `***${form.summa},00` : '***0,00';
  const dollarPrint = form.dollar ? `$ ${form.dollar}` : '$ 0.00';
  const micr = `‖${form.tartibraqam}‖  :${shortDate.replace(/\./g, '')}:  ${form.kvitansiyakod || '0000000000'}‖`;
  const qrText = [
    'RISOLA TRAVEL LUX MCHJ',
    `Kvitansiya No ${form.tartibraqam}`,
    `Chek ID: ${form.kvitansiyakod}`,
    `Sana: ${shortDate} ${timeNow}`,
    `Tolovchi: ${form.fullname}`,
    `Summa: ${digits(form.summa) || 0} UZS`,
    `Kassir: ${kassirIsm}`,          // dollar QR'ga kiritilmaydi — mijoz skanerlab ko'rmasin
  ].join('\n');

  return (
    <div className="kv-page">
      {successMsg && <div className="alert success no-print">{successMsg}</div>}
      {errorMsg && <div className="alert error no-print">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <fieldset className="kv-fieldset" disabled={saved}>
          {/* ===================== CHEK VARAG'I ===================== */}
          <div className="containerKvitansiya kv-sheet">
            {!saved && <div className="kv-draft" aria-hidden="true">NAMUNA · SAQLANMAGAN</div>}

            {/* ---------- TALON (kassada qoladi) ---------- */}
            <aside className="kv-talon">
              <Guilloche />
              <div className="kv-talon-org">RISOLA TRAVEL LUX</div>
              <div className="kv-talon-title">Kassa kirim orderi</div>

              <div className="kv-talon-row">
                <div><span className="kv-lbl">№</span> <b className="kv-red kv-mono">{form.tartibraqam}</b></div>
                <div className="kv-mono">{shortDate}</div>
              </div>

              <div className="kv-talon-id">
                <span className="kv-lbl">Chek ID</span>
                <b className="kv-mono">{chekId}</b>
              </div>

              <div className="kv-tf"><span className="kv-lbl">Kimdan qabul qilindi</span><div className="kv-tv">{form.fullname || ' '}</div></div>
              <div className="kv-tf"><span className="kv-lbl">Asos (to'lov maqsadi)</span><div className="kv-tv">Umra xizmati</div></div>
              <div className="kv-talon-2">
                <div className="kv-tf"><span className="kv-lbl">Uchish</span><div className="kv-tv">{formatSana(form.sana) || ' '}</div></div>
                <div className="kv-tf"><span className="kv-lbl">Kishi</span><div className="kv-tv">{form.amountpeople || ' '}</div></div>
              </div>

              <div className="kv-talon-sum">
                <span className="kv-lbl">Summa</span>
                <b className="kv-mono">{form.summa || '0'} so'm</b>
                <small className="kv-mono kv-staff-only">{dollarPrint}</small>
              </div>

              <div className="kv-tf kv-talon-sign"><span className="kv-lbl">Kassir</span><div className="kv-tv">{kassirIsm}</div></div>

              <div className="kv-talon-foot">Talon · kassada qoladi</div>
            </aside>

            {/* ---------- QIRQISH CHIZIG'I ---------- */}
            <div className="kv-cut" aria-hidden="true"><span>✂</span></div>

            {/* ---------- KVITANSIYA (to'lovchiga beriladi) ---------- */}
            <section className="kv-main">
              <Guilloche rosette />

              <header className="kv-head">
                <div className="kv-brand">
                  <img src={logo} alt="Risola tourism" className="kv-logo" />
                  <div>
                    <div className="kv-org">"RISOLA TRAVEL LUX" MCHJ</div>
                    <div className="kv-org-sub">Umra ziyorati xizmatlari</div>
                  </div>
                </div>

                <div className="kv-ids">
                  <div className="kv-doc">KVITANSIYA</div>
                  <div className="kv-id-row">
                    <div className="kv-no">
                      <span>№</span>
                      <b className="kv-mono">{form.tartibraqam}</b>
                    </div>
                    <label className="kv-chekid">
                      <span>CHEK ID</span>
                      <input
                        name="kvitansiyakod"
                        value={form.kvitansiyakod}
                        onChange={handleChange}
                        placeholder="Kiriting"
                        maxLength={24}
                        autoComplete="off"
                        required
                      />
                    </label>
                  </div>
                </div>
              </header>

              <div className="kv-bar">
                <span className="kv-bar-title">Naqd pul qabul qilinganligi to'g'risida</span>
                <span>Sana: {shortDate} · {timeNow}</span>
              </div>
              <div className="kv-microprint" aria-hidden="true">
                {'RISOLATRAVELLUX·KVITANSIYA·'.repeat(30)}
              </div>

              <div className="kv-body">
                <div className="kv-fields">
                  <div className="kv-row kv-r1">
                    <label className="kv-f">
                      <span className="kv-lbl">To'lovchi (F.I.Sh.)</span>
                      <input name="fullname" value={form.fullname} onChange={handleChange} placeholder="Ism Familiya" required />
                    </label>
                    <label className="kv-f">
                      <span className="kv-lbl">Telefon</span>
                      <input name="phonenumber" value={form.phonenumber} onChange={handlePhone} placeholder="90 123 45 67" maxLength={12} inputMode="tel" required />
                    </label>
                  </div>

                  <div className="kv-row kv-r2">
                    <label className="kv-f">
                      <span className="kv-lbl">Yashash manzili</span>
                      <input name="location" value={form.location} onChange={handleChange} placeholder="Qayerdan" required />
                    </label>
                    <label className="kv-f">
                      <span className="kv-lbl">Uchish sanasi</span>
                      <input name="sana" type="date" className="kv-only-screen" value={form.sana} onChange={handleChange} required />
                      <span className="kv-only-print kv-pv">{formatSana(form.sana)}</span>
                    </label>
                    <label className="kv-f">
                      <span className="kv-lbl">Kishilar soni</span>
                      <input name="amountpeople" value={form.amountpeople} onChange={handleChange} inputMode="numeric" placeholder="0" required />
                    </label>
                  </div>

                  <div className="kv-row kv-r2">
                    <div className="kv-f">
                      <span className="kv-lbl">To'lov maqsadi</span>
                      <div className="kv-pv kv-static">Umra xizmati</div>
                    </div>
                    <label className="kv-f">
                      <span className="kv-lbl">Alohida xona</span>
                      <input name="amountroom" value={form.amountroom} onChange={handleChange} inputMode="numeric" placeholder="—" />
                    </label>
                    <label className="kv-f">
                      <span className="kv-lbl">Qo'shimcha to'lov</span>
                      <input name="qoshimchatolov" value={form.qoshimchatolov} onChange={handleChange} inputMode="numeric" placeholder="—" />
                    </label>
                  </div>
                </div>

                <div className="kv-qr">
                  <QRCodeSVG value={qrText} size={88} level="M" fgColor="#000000" bgColor="#ffffff" />
                  <span>Skanerlang</span>
                </div>
              </div>

              {/* ---------- SUMMA: so'm ↔ dollar ---------- */}
              <div className="kv-amount">
                <div className="kv-amount-lbl">Summa</div>
                <div className="kv-amount-uzs">
                  <input
                    name="summa"
                    className="kv-only-screen"
                    value={form.summa}
                    onChange={handleChange}
                    placeholder="0"
                    inputMode="numeric"
                    required
                  />
                  <span className="kv-only-print">{summaPrint}</span>
                  <em>SO'M</em>
                </div>
                {/* faqat xodimlar uchun: ekranda va bazada bor, mijoz chekida chiqmaydi */}
                <div className="kv-amount-usd kv-staff-only">
                  <span className="kv-lbl">Dollarda <em className="kv-staff-tag">mijozga chiqmaydi</em></span>
                  <div className="kv-usd-input">
                    <i>$</i>
                    <input
                      name="dollar"
                      value={form.dollar}
                      onChange={handleChange}
                      placeholder="0.00"
                      inputMode="decimal"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="kv-rate-line kv-staff-only">
                {rate
                  ? <>Kurs: 1 USD = <b>{fmtDec(rate)}</b> so'm · {kursManba} · {kursSana}</>
                  : <>Kurs: —</>}
              </div>

              <div className="kv-words">
                <span className="kv-lbl">So'z bilan:</span>
                <b>{sumInWords || ' '}</b>
              </div>

              {/* ---------- IMZOLAR ---------- */}
              <div className="kv-sign">
                <div className="kv-sign-col">
                  <span className="kv-lbl">Qabul qildi (kassir)</span>
                  <select name="kassir" className="kv-only-screen" value={form.kassir} onChange={handleChange} required>
                    {Object.entries(KASSIRLAR).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                  </select>
                  <span className="kv-only-print kv-pv">{kassirIsm}</span>
                  <div className="kv-sign-line">imzo</div>
                </div>
                <div className="kv-sign-col">
                  <span className="kv-lbl">To'lovchi</span>
                  <span className="kv-pv">{form.fullname || ' '}</span>
                  <div className="kv-sign-line">imzo</div>
                </div>
                <div className="kv-stamp">M.O.</div>
              </div>

              <footer className="kv-foot">
                <span className="kv-micr">{micr}</span>
                <span>To'lovchiga beriladi · {longDate}</span>
              </footer>
            </section>
          </div>

          {/* ===================== DOLLAR KURSI PANELI (faqat ekranda) ===================== */}
          <div className="kv-kurs no-print">
            <div className="kv-kurs-head">
              <b>Dollar kursi</b>
              <span className={`kv-kurs-status is-${kursHolat}`}>
                {kursHolat === 'loading' && 'Yuklanmoqda…'}
                {kursHolat === 'ok' && `${kursData?.manba} · ${new Date(kursData?.olingan).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}${kursData?.eskirgan ? ' · oxirgi saqlangan' : ''}`}
                {kursHolat === 'error' && "Kurs olinmadi — qo'lda kiriting"}
              </span>
              <button type="button" className="kv-kurs-refresh" onClick={() => fetchKurs(true)}>↻ Yangilash</button>
            </div>

            <div className="kv-kurs-opts">
              {['sell', 'buy', 'cb', 'xalqaro'].map(t => {
                const v = kursQiymat(t);
                return (
                  <label key={t} className={`kv-opt ${kursTuri === t ? 'is-active' : ''} ${!v ? 'is-off' : ''}`}>
                    <input type="radio" name="kursTuri" value={t} checked={kursTuri === t} disabled={!v} onChange={() => { setKursTuri(t); qoldaYozish('', ''); }} />
                    <span>{KURS_NOMI[t]}</span>
                    <b>{v ? fmtDec(v) : '—'}</b>
                  </label>
                );
              })}
              <label className={`kv-opt ${kursTuri === 'manual' ? 'is-active' : ''}`}>
                <input type="radio" name="kursTuri" value="manual" checked={kursTuri === 'manual'} onChange={() => { setQoldaKurs(rate ? fmtDec(rate) : ''); setKursTuri('manual'); }} />
                <span>Qo'lda</span>
                <input
                  className="kv-opt-input"
                  value={kursTuri === 'manual' ? qoldaKurs : ''}
                  onChange={e => {
                    const v = cleanDecInput(e.target.value);
                    setKursTuri('manual');
                    setQoldaKurs(v);
                    qoldaYozish(shortDate, v);
                  }}
                  placeholder="12 100.00"
                  inputMode="decimal"
                />
              </label>
            </div>
            {kursHolat !== 'loading' && !kursData?.kapitalbank && (
              <p className="kv-kurs-warn">
                Kapitalbank sayti kursni serverga bermayapti. Bank kursini Kapitalbank ilovasidan ko'rib
                «Qo'lda» katagiga yozsangiz, shu kompyuterda bugun kun bo'yi eslab qolinadi.
              </p>
            )}
            <p className="kv-kurs-hint">
              So'mda summa yozsangiz — dollari, dollar yozsangiz — so'mi avtomatik hisoblanadi.
              {kursData?.xalqaro && <> Xalqaro kurs manbasi: <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a>.</>}
            </p>
          </div>
        </fieldset>

        <div className="kv-actions no-print">
          {!saved && (
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          )}
          {saved && (
            <>
              <button type="button" onClick={() => window.print()} className="btn-print">Chop etish</button>
              <button type="button" onClick={handleNew} className="btn-new">Yangi kvitansiya</button>
            </>
          )}
        </div>
      </form>

      <div className="footerButton no-print">
        <button className="back-button" onClick={() => navigate('/')}>Asosiy sahifaga qaytish</button>
        <button className="back-button" onClick={() => navigate('/chekRoyxati')}>Cheklar ro'yxatini ko'rish</button>
      </div>
    </div>
  );
}

export default Kvitansiya;
