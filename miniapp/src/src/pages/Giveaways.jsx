import { useState, useEffect } from 'react';

export default function Giveaways({ user, showToast }) {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(null);

  const load = () => {
    fetch('/api/giveaways')
      .then(r => r.json())
      .then(setGiveaways)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const enter = async (giveaway) => {
    setEntering(giveaway.id);
    try {
      const res = await fetch(`/api/giveaways/${giveaway.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.telegram_id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 Вы участвуете!');
        load();
      } else {
        showToast('❌ ' + (data.error || 'Ошибка'));
      }
    } catch {
      showToast('❌ Ошибка сети');
    } finally {
      setEntering(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '∞';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🎁 Розыгрыши</div>
      {loading ? <div className="spinner" /> : giveaways.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎪</div>
          <div>Розыгрышей пока нет</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {giveaways.map(g => (
            <div key={g.id} style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              borderRadius: 16, padding: '16px', border: '1px solid #2a2a4a',
            }}>
              {g.photo_url && (
                <img src={g.photo_url} alt="" style={{
                  width: '100%', height: 140, objectFit: 'cover',
                  borderRadius: 10, marginBottom: 12,
                }} />
              )}
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{g.title}</div>
              {g.description && <div style={{ fontSize: 13, color: '#aaa', marginBottom: 10 }}>{g.description}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ background: '#6C63FF22', color: '#6C63FF', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                  🏆 {g.prize}
                </span>
                <span style={{ background: '#FF658422', color: '#FF6584', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                  📅 до {formatDate(g.ends_at)}
                </span>
                {g.min_deposit > 0 && (
                  <span style={{ background: '#FFB80022', color: '#FFB800', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                    💰 мин. {g.min_deposit} ⭐
                  </span>
                )}
              </div>
              {g.entered ? (
                <div style={{
                  textAlign: 'center', padding: '10px', borderRadius: 12,
                  background: '#00C85322', color: '#00C853', fontWeight: 600, fontSize: 14,
                }}>
                  ✅ Вы участвуете
                </div>
              ) : (
                <button onClick={() => enter(g)} disabled={entering === g.id} style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  opacity: entering === g.id ? 0.6 : 1,
                }}>
                  {entering === g.id ? '...' : 'Участвовать'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
