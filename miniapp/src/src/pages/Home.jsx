import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, Zap, Gift, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../App.jsx';
import toast from 'react-hot-toast';

const fadeUp = (i = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } });

export default function Home() {
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [giveaways, setGiveaways] = useState([]);
  const [entered, setEntered] = useState({});
  const [enterErr, setEnterErr] = useState({});

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/giveaways').then(r => r.json()).then(d => Array.isArray(d) ? setGiveaways(d) : null).catch(() => {});
  }, []);

  const enterGiveaway = async (g) => {
    if (!user || entered[g.id]) return;
    setEnterErr(p => ({ ...p, [g.id]: null }));
    try {
      const res = await fetch(`/api/giveaways/${g.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.telegram_id }),
      });
      const data = await res.json();
      if (data.success) {
        setEntered(p => ({ ...p, [g.id]: true }));
        toast.success('Вы участвуете в розыгрыше!');
      } else if (data.need_subscribe) {
        setEnterErr(p => ({ ...p, [g.id]: { type: 'subscribe', channel: data.channel, msg: data.error } }));
      } else {
        setEnterErr(p => ({ ...p, [g.id]: { type: 'error', msg: data.error } }));
        toast.error(data.error);
      }
    } catch { toast.error('Ошибка соединения'); }
  };

  const h = new Date().getHours();
  const greeting = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div style={{ padding: '0 0 8px' }}>
      <motion.div {...fadeUp(0)} style={{ background: 'linear-gradient(135deg, #1a1050 0%, #0d0d1a 60%, #1a0d2e 100%)', padding: '56px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4 }}>{greeting},</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>{user?.first_name || 'Друг'} 👋</h1>
        <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: 14 }}>Добро пожаловать в Gift Shop</p>
        <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 40, padding: '8px 16px' }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{user?.balance ?? 0}</span>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>звёзд</span>
        </div>
      </motion.div>

      <div style={{ padding: '20px 16px 0' }}>
        <motion.div {...fadeUp(1)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Пользователей', value: stats?.total_users ?? '—', Icon: Users, color: '#6C63FF' },
            { label: 'Заказов', value: stats?.total_orders ?? '—', Icon: ShoppingBag, color: '#ff6b9d' },
            { label: 'Розыгрышей', value: stats?.active_giveaways ?? '—', Icon: Trophy, color: '#FFD700' },
            { label: 'Потрачено ⭐', value: stats?.total_revenue ?? '—', Icon: Zap, color: '#4ade80' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '14px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={18} color={color} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp(2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Trophy size={18} color="var(--gold)" />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Розыгрыши</h2>
          </div>

          {giveaways.length === 0 ? (
            <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '32px 20px', textAlign: 'center' }}>
              <Gift size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Скоро появятся новые розыгрыши</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {giveaways.map((g, i) => {
                const err = enterErr[g.id];
                const endsAt = g.ends_at ? new Date(g.ends_at) : null;
                return (
                  <motion.div key={g.id} {...fadeUp(3 + i)} style={{ background: 'var(--card)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {g.photo_url && (
                      <img src={g.photo_url} alt={g.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    )}
                    <div style={{ background: 'linear-gradient(90deg, rgba(108,99,255,0.2), rgba(255,107,157,0.1))', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} color="var(--gold)" />
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{g.title}</span>
                        {g.entries_count > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{g.entries_count} уч.</span>}
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      {g.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 10 }}>{g.description}</p>}
                      {g.conditions_text && (
                        <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, color: 'var(--text2)' }}>📋 {g.conditions_text}</p>
                        </div>
                      )}
                      {g.channel_username && (
                        <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, color: 'var(--gold)' }}>📢 Условие: подписка на @{g.channel_username}</p>
                        </div>
                      )}
                      {g.min_deposit > 0 && (
                        <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid rgba(255,107,157,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                          <p style={{ fontSize: 12, color: '#ff6b9d' }}>💰 Мин. депозит: {g.min_deposit} ⭐</p>
                        </div>
                      )}
                      {endsAt && (
                        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>⏰ До {endsAt.toLocaleString('ru-RU')}</p>
                      )}
                      {err?.type === 'subscribe' && (
                        <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <AlertCircle size={14} color="#ff6b6b" />
                          <div>
                            <p style={{ fontSize: 12, color: '#ff6b6b' }}>{err.msg}</p>
                            <a href={`https://t.me/${err.channel}`} target="_blank" style={{ fontSize: 11, color: 'var(--accent2)', textDecoration: 'none' }}>Подписаться →</a>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text3)' }}>Приз</p>
                          <p style={{ fontWeight: 700, color: 'var(--gold)' }}>{g.prize || '🎁 Сюрприз'}</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => enterGiveaway(g)}
                          style={{ background: entered[g.id] ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, var(--accent), #9d96ff)', color: entered[g.id] ? '#4ade80' : 'white', border: entered[g.id] ? '1px solid rgba(74,222,128,0.3)' : 'none', borderRadius: 40, padding: '9px 18px', fontWeight: 700, fontSize: 13 }}>
                          {entered[g.id] ? '✓ Участвую' : 'Участвовать'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div {...fadeUp(4)} style={{ marginTop: 20, background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(255,107,157,0.08))', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 18, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>🎁</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Анлимитные подарки</p>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 3 }}>Дари мишек, алмазы и многое другое прямо в Telegram</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
