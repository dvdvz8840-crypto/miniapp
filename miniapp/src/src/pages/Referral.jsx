import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Gift, ChevronRight, Share2, Zap } from 'lucide-react';
import { useApp } from '../App.jsx';
import toast from 'react-hot-toast';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.07 },
});

export default function Referral() {
  const { user, tg } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/referrals/${user.telegram_id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const botUsername = 'your_bot'; // replace with actual bot username
  const refLink = `https://t.me/${botUsername}?start=${data?.referral_code || ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => toast.success('Ссылка скопирована!')).catch(() => {
      const el = document.createElement('textarea');
      el.value = refLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success('Ссылка скопирована!');
    });
  };

  const shareLink = () => {
    if (tg?.shareUrl) {
      tg.shareUrl(refLink, 'Присоединяйся к Gift Shop и получай подарки! 🎁');
    } else {
      copyLink();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data?.referral_code || '').then(() => toast.success('Код скопирован!')).catch(copyLink);
  };

  return (
    <div style={{ padding: '0 0 8px' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '56px 16px 28px',
          background: 'linear-gradient(180deg, rgba(108,99,255,0.15) 0%, var(--bg) 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--accent), #ff6b9d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
        }}>
          <Users size={32} color="white" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Реферальная программа</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
          Приглашай друзей и получай <strong style={{ color: 'var(--accent2)' }}>+10 ⭐</strong> за каждого
        </p>
      </motion.div>

      <div style={{ padding: '0 16px' }}>
        <motion.div {...fadeUp(0)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Приглашено', value: data?.count ?? 0, icon: '👥', color: 'var(--accent)' },
            { label: 'Заработано', value: `${(data?.count ?? 0) * 10} ⭐`, icon: '⭐', color: 'var(--gold)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{
              background: 'var(--card)', borderRadius: 18,
              border: '1px solid var(--border)', padding: '16px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp(1)} style={{
          background: 'var(--card)', borderRadius: 18,
          border: '1px solid var(--border)', padding: '16px', marginBottom: 12,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ваш реферальный код
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1, background: 'var(--bg2)', borderRadius: 12,
              padding: '12px 14px', fontFamily: 'monospace',
              fontSize: 20, fontWeight: 800, letterSpacing: 2,
              color: 'var(--accent2)',
            }}>
              {loading ? '------' : (data?.referral_code || '------')}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={copyCode}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(108,99,255,0.15)',
                border: '1px solid rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Copy size={18} color="var(--accent2)" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(2)} style={{
          background: 'var(--card)', borderRadius: 18,
          border: '1px solid var(--border)', padding: '16px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Реферальная ссылка
          </p>
          <div style={{
            background: 'var(--bg2)', borderRadius: 12, padding: '12px 14px',
            fontSize: 12, color: 'var(--text2)', marginBottom: 10,
            wordBreak: 'break-all', lineHeight: 1.4,
          }}>
            {loading ? 'Загрузка...' : refLink}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              style={{
                flex: 1, background: 'rgba(108,99,255,0.15)',
                border: '1px solid rgba(108,99,255,0.3)',
                color: 'var(--accent2)', borderRadius: 12, padding: '11px',
                fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Copy size={15} /> Копировать
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={shareLink}
              style={{
                flex: 1, background: 'linear-gradient(135deg, var(--accent), #9d96ff)',
                color: 'white', borderRadius: 12, padding: '11px',
                fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Share2 size={15} /> Поделиться
            </motion.button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(3)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={16} color="var(--text2)" />
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Приглашённые ({data?.count ?? 0})</h3>
          </div>

          {loading ? (
            <div className="shimmer" style={{ borderRadius: 18, height: 80 }} />
          ) : !data?.referrals?.length ? (
            <div style={{
              background: 'var(--card)', borderRadius: 18, border: '1px solid var(--border)',
              padding: '32px 20px', textAlign: 'center',
            }}>
              <Gift size={36} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Пока никого нет</p>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Поделитесь ссылкой с друзьями</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.referrals.map((r, i) => (
                <motion.div key={r.telegram_id} {...fadeUp(4 + i)} style={{
                  background: 'var(--card)', borderRadius: 14,
                  border: '1px solid var(--border)', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #ff6b9d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700,
                    }}>
                      {(r.first_name || r.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{r.first_name || r.username || 'Пользователь'}</p>
                      {r.username && <p style={{ color: 'var(--text3)', fontSize: 11 }}>@{r.username}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontWeight: 600, fontSize: 13 }}>
                    +10 ⭐
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div {...fadeUp(5)} style={{
          marginTop: 20,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(108,99,255,0.08))',
          border: '1px solid rgba(255,215,0,0.2)', borderRadius: 18, padding: '16px',
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={15} color="var(--gold)" /> Как это работает
          </p>
          {[
            'Поделитесь своей реферальной ссылкой',
            'Друг открывает мини-приложение по ссылке',
            'Вы получаете 10 ⭐ на баланс',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--accent2)',
              }}>{i + 1}</div>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>{text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
