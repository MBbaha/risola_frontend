import React, { useState, useRef, useEffect } from 'react';
import './PinLogin.css';

const CORRECT_PIN = "606264"; // ← o'z PIN kodingizni yozing

const KEYS = [
  { d: '1', s: '' },    { d: '2', s: 'ABC' }, { d: '3', s: 'DEF' },
  { d: '4', s: 'GHI' }, { d: '5', s: 'JKL' }, { d: '6', s: 'MNO' },
  { d: '7', s: 'PQRS' },{ d: '8', s: 'TUV' }, { d: '9', s: 'WXYZ' },
];

export default function PinLogin({ onSuccess }) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [show, setShow]     = useState(false);
  const [pressed, setPressed] = useState(null);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addDigit = (k) => {
    if (pin.length >= 12) return;
    setPin(p => p + k);
    setError('');
    setPressed(k);
    setTimeout(() => setPressed(null), 150);
  };

  const del   = () => setPin(p => p.slice(0, -1));
  const clear = () => { setPin(''); setError(''); };

  const check = () => {
    if (pin === CORRECT_PIN) {
      onSuccess();
    } else {
      setError("PIN noto'g'ri. Qayta urining.");
      setPin('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && pin.length >= 4) check();
  };

  return (
    <div className="pl-overlay">
      <div className="pl-card">

        {/* Header */}
        <div className="pl-header">
          <span className="pl-header-icon">✈️</span>
          <h2>Risola Travel Lux</h2>
          <p>Boshqaruv tizimi</p>
        </div>

        {/* Body */}
        <div className="pl-body">
          <p className="pl-hint">PIN kodingizni kiriting</p>

          {/* Input */}
          <div className="pl-input-wrap">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                setPin(v.slice(0, 12));
                setError('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={12}
              placeholder="••••••"
              inputMode="numeric"
              autoComplete="off"
              className="pl-input"
            />
            <button
              className="pl-eye"
              onClick={() => setShow(s => !s)}
              aria-label="Ko'rsatish"
            >
              {show ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Error */}
          <p className="pl-error">{error}</p>

          {/* Numpad */}
          <div className="pl-numpad">
            {KEYS.map(({ d, s }) => (
              <button
                key={d}
                className={`pl-nb${pressed === d ? ' pl-nb-pressed' : ''}`}
                onClick={() => addDigit(d)}
              >
                <span className="pl-nb-main">{d}</span>
                {s && <span className="pl-nb-sub">{s}</span>}
              </button>
            ))}
            <button className="pl-nb pl-nb-muted" onClick={clear}>Tozala</button>
            <button className="pl-nb" onClick={() => addDigit('0')}>
              <span className="pl-nb-main">0</span>
            </button>
            <button className="pl-nb pl-nb-danger" onClick={del} aria-label="O'chirish">
              ⌫
            </button>
          </div>

          {/* Enter tugmasi */}
          <button
            className="pl-enter"
            onClick={check}
            disabled={pin.length < 4}
          >
            Kirish
          </button>
        </div>

      </div>
    </div>
  );
}
