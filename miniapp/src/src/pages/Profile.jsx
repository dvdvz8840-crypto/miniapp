import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Tag, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../App.jsx';
import toast from 'react-hot-toast';

const fadeUp = (i = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.07 } });

function BottomSheet({ onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--card2)', borderRadius: '28px 28px 0 0', border: '1px solid var(--border)', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
      >
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '12px auto 0' }} />
        <div style={{ padding: '16px 20px 0' }}>{children}</div>
      </motion.div>
    </div>
  );
}

function TopUpModal({ onClose, onTopUp }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const options = [50, 100, 250, 500];

  const handleTopUp = async () => {
    const stars = parseInt(amount);
    if (!stars || stars < 1) { toast.error('Введите корректную сумму'); return; }
    setLoading(true);
    await onTopUp(stars);
    setLoading(false);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Пополнить баланс</h3>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Пополнение через Telegram Stars ⭐</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {options.map(o => (
          <motion.button key={o} whileTap={{ scale: 0.92 }} onClick={() => setAmount(String(o))}
            style={{ background: amount === String(o) ? 'var(--accent)' : 'var(--bg2)', border: `1px solid ${amount === String(o) ? 'var(--accent)' : 'var(--border)'}`, color: 'white', borderRadius: 12, padding: '10px 4px', fontWeight: 700, fontSize: 14 }}>
            {o} ⭐
          </motion.button>
        ))}
      </div>
      <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="Другая сумма..."
        style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '13px 16px', color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none', marginBottom: 14 }} />
      <motion.button whileTap={{ scale: 0.96 }} onClick={handleTopUp} disabled={loading}
        style={{ width: '100%', background: 'linear-gradient(135deg, var(--gold), #ffb347)', color: '#1a1000', borderRadius: 14, padding: '15px', fontWeight: 800, fontSize: 16, opacity: loading ? 0.7 : 1, marginBottom: 10 }}>
        {loading ? 'Обработка...' : `Пополнить ${amount ? amount + ' ⭐' : ''}`}
      </motion.button>
      <p style={{ color: 'var(--text3)', fontSize: 11, textAlign: 'center', paddingBottom: 4 }}>Оплата через официальный механизм Telegram Stars</p>
    </BottomSheet>
  );
}

function PromoModal({ onClose, onApply }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!code.trim()) { toast.error('Введите промокод'); return; }
    setLoading(true);
    await onApply(code.trim().toUpperCase());
    setLoading(false);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Промокод</h3>
      <input
        value={code} onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder="Введите промокод..." autoFocus
        style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '13px 16px', color: 'white', fontSize: 16, fontFamily: 'monospace', fontWeight: 700, outline: 'none', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}
      />
      <motion.button whileTap={{ scale: 0.96 }} onClick={handle} disabled={loading}
        style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent), #9d96ff)', color: 'white', borderRadius: 14, padding: '15px', fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1, marginBottom: 4 }}>
        {loading ? 'Проверка...' : 'Применить'}
      </motion.button>
    </BottomSheet>
  );
}

export default function Profile() {
  const { user, refreshUser } = useApp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const handleTopUp = async (amount) => {
    try {
      const res = await fetch('/api/topup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.telegram_id, amount }) });
      const data = await res.json();
      if (data.success) { toast.success(`Баланс пополнен на ${amount} ⭐`); refreshUser(); }
      else toast.error(data.error || 'Ошибка');
    } catch { toast.error('Ошибка соединения'); }
  };

  const handlePromo = async (code) => {
    try {
      const res = await fetch('/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user?.telegram_id, code }) });
      const data = await res.json();
      if (data.success) { toast.success(`Промокод применён! +${data.bonus} ⭐`); refreshUser(); }
      else toast.error(data.error || 'Неверный промокод');
    } catch { toast.error('Ошибка соединения'); }
  };

  const initials = ((user?.first_name || '')[0] || '?').toUpperCase();

  return (
    <div style={{ padding: '0 0 8px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: '56px 20px 28px', background: 'linear-gradient(180deg, rgba(108,99,255,0.12) 0%, var(--bg) 100%)', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 14px', background: 'linear-gradient(135deg, var(--accent), #ff6b9d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, border: '3px solid rgba(108,99,255,0.5)' }}>
          {user?.photo_url ? <img src={user.photo_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : initials}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user?.first_name} {user?.last_name || ''}</h2>
        {user?.username && <p style={{ color: 'var(--text2)', fontSize: 14 }}>@{user.username}</p>}
      </motion.div>

      <div style={{ padding: '0 16px' }}>
        <motion.div {...fadeUp(0)} style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(157,150,255,0.08))', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Баланс</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 40 }}>⭐</span>
            <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-2px' }}>{user?.balance ?? 0}</span>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowTopUp(true)}
            style={{ background: 'linear-gradient(135deg, var(--gold), #ffb347)', color: '#1a1000', borderRadius: 40, padding: '11px 28px', fontWeight: 800, fontSize: 14 }}>
            Пополнить баланс
          </motion.button>
        </motion.div>

        <motion.div {...fadeUp(1)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Рефералов', value: user?.referrals_count ?? 0, Icon: Users, color: '#6C63FF' },
            { label: 'Дата входа', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—', Icon: Clock, color: '#ff6b9d' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '14px' }}>
              <Icon size={18} color={color} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 18, fontWeight: 800 }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp(2)} style={{ background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'Пополнить баланс', sublabel: 'Telegram Stars', Icon: Star, color: '#FFD700', action: () => setShowTopUp(true) },
            { label: 'Промокод', sublabel: 'Введите код для бонуса', Icon: Tag, color: 'var(--accent2)', action: () => setShowPromo(true) },
          ].map(({ label, sublabel, Icon, color, action }, i, arr) => (
            <motion.button key={label} whileTap={{ opacity: 0.7 }} onClick={action}
              style={{ width: '100%', background: 'transparent', display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
                <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{sublabel}</p>
              </div>
              <ChevronRight size={16} color="var(--text3)" />
            </motion.button>
          ))}
        </motion.div>

        <motion.div {...fadeUp(3)} style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>ID пользователя</p>
          <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 15, color: 'var(--text2)' }}>#{user?.telegram_id}</p>
        </motion.div>
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} onTopUp={handleTopUp} />}
      {showPromo && <PromoModal onClose={() => setShowPromo(false)} onApply={handlePromo} />}
    </div>
  );
}
