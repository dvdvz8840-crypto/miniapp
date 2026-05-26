import { useState, useEffect, useCallback } from 'react';
import Shop from './pages/Shop.jsx';
import Orders from './pages/Orders.jsx';
import Giveaways from './pages/Giveaways.jsx';
import Profile from './pages/Profile.jsx';

const tg = window.Telegram?.WebApp;

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('shop');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    const tgUser = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param;

    const payload = {
      telegram_id: tgUser?.id || 999999,
      username: tgUser?.username || 'demo',
      first_name: tgUser?.first_name || 'Demo',
      last_name: tgUser?.last_name || '',
      photo_url: tgUser?.photo_url || '',
      referral_code: startParam || null,
    };

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(data => {
        if (data.banned) {
          alert(`❌ Вы заблокированы\nПричина: ${data.reason}`);
        } else {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = () => {
    if (!user) return;
    fetch(`/api/user/${user.telegram_id}`)
      .then(r => r.json())
      .then(data => { if (data.telegram_id) setUser(data); });
  };

  if (loading) return <div className="spinner" />;
  if (!user) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Ошибка загрузки</div>;

  const tabs = [
    { id: 'shop', icon: '🛍', label: 'Магазин' },
    { id: 'orders', icon: '📦', label: 'Заказы' },
    { id: 'giveaways', icon: '🎁', label: 'Розыгрыши' },
    { id: 'profile', icon: '👤', label: 'Профиль' },
  ];

  return (
    <div style={{ paddingBottom: 70 }}>
      {tab === 'shop' && <Shop user={user} onRefresh={refreshUser} showToast={showToast} />}
      {tab === 'orders' && <Orders user={user} />}
      {tab === 'giveaways' && <Giveaways user={user} showToast={showToast} />}
      {tab === 'profile' && <Profile user={user} onRefresh={refreshUser} showToast={showToast} />}

      {toast && <div className="toast">{toast}</div>}

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#12122a', borderTop: '1px solid #2a2a4a',
        display: 'flex', zIndex: 100,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', background: 'none',
            color: tab === t.id ? '#6C63FF' : '#666',
            fontSize: 11, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, transition: 'color 0.2s',
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
