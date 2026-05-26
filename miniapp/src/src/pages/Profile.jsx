import { useState, useEffect } from 'react';

export default function Profile({ user, onRefresh, showToast }) {
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/referrals/${user.telegram_id}`)
      .then(r => r.json())
      .then(data => setReferrals(data.referrals || []));
  }, [user.telegram_id]);

  const copyRef = () => {
    const link = `https://t.me/satapp_bot?start=${user.referral_code}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('📋 Ссылка скопирована!');
  };

  const stats = [
    { label: 'Баланс', value: `${user.balance} ⭐`, icon: '⭐' },
    { label: 'Пополнено', value: `${user.total_deposited} ⭐`, icon: '💰' },
    { label: 'Рефералы', value: user.referrals_count || 0, icon: '👥' },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {user.photo_url ? (
          <img src={user.photo_url} alt="" style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '3px solid #6C63FF', marginBottom: 8,
          }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 8px',
          }}>
            {(user.first_name || '?')[0]}
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 18 }}>
          {user.first_name} {user.last_name}
        </div>
        {user.username && (
          <div style={{ color: '#888', fontSize: 13 }}>@{user.username}</div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#1a1a2e', borderRadius: 14, padding: '14px 10px',
            textAlign: 'center', border: '1px solid #2a2a4a',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div style={{
        background: '#1a1a2e', borderRadius: 14, padding: '14px 16px',
        border: '1px solid #2a2a4a', marginBottom: 16,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>🔗 Реферальная программа</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
          Приглашай друзей и получай +10 ⭐ за каждого
        </div>
        <button onClick={copyRef} style={{
          width: '100%', padding: '10px', borderRadius: 10,
          background: copied ? '#00C853' : '#6C63FF',
          color: '#fff', fontWeight: 600, fontSize: 14, transition: 'background 0.3s',
        }}>
          {copied ? '✅ Скопировано!' : '📋 Копировать ссылку'}
        </button>
      </div>

      {/* Referral list */}
      {referrals.length > 0 && (
        <div style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 16px', border: '1px solid #2a2a4a' }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>👥 Мои рефералы ({referrals.length})</div>
          {referrals.map((r, i) => (
            <div key={r.telegram_id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderTop: i > 0 ? '1px solid #2a2a4a' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}>
                {(r.first_name || '?')[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.first_name} {r.last_name}</div>
                {r.username && <div style={{ fontSize: 11, color: '#888' }}>@{r.username}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
