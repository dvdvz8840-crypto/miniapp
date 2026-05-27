import { useState, useEffect, createContext, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Referral from './pages/Referral.jsx';
import Profile from './pages/Profile.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

export default function App() {
  const [tab, setTab] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); }

    let telegramUser = tg?.initDataUnsafe?.user;
    if (!telegramUser) {
      telegramUser = { id: 999999999, username: 'devuser', first_name: 'Dev', last_name: 'User', photo_url: null };
    }

    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || tg?.initDataUnsafe?.start_param || null;
    const adminParam = params.get('admin');

    async function init() {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || 'User',
            last_name: telegramUser.last_name || null,
            photo_url: telegramUser.photo_url || null,
            referral_code: refCode,
          }),
        });

        const data = await res.json();

        if (data.banned) {
          setBanned(data);
          setLoading(false);
          return;
        }

        if (data.user) {
          setUser(data.user);
          const viteAdminId = import.meta.env.VITE_ADMIN_ID;
          if (adminParam === 'true' || (viteAdminId && String(telegramUser.id) === String(viteAdminId))) {
            setIsAdmin(true);
            setTab('admin');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/${user.telegram_id}`);
      const data = await res.json();
      if (data.telegram_id) setUser(data);
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 20 }}>
        <div style={{ fontSize: 48 }}>🎁</div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Загрузка...</p>
      </div>
    );
  }

  if (banned) {
    const until = banned.banned_until ? new Date(banned.banned_until) : null;
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 32, textAlign: 'center', gap: 0 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ff6b6b', marginBottom: 12 }}>Вы заблокированы</h1>
        <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 18, padding: '20px 24px', maxWidth: 320, marginBottom: 16 }}>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: until ? 10 : 0 }}>
            <strong style={{ color: 'white' }}>Причина:</strong> {banned.reason || 'Нарушение правил сервиса'}
          </p>
          {until ? (
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              <strong style={{ color: 'white' }}>До:</strong> {until.toLocaleString('ru-RU')}
            </p>
          ) : (
            <p style={{ color: '#ff6b6b', fontSize: 14, fontWeight: 600, marginTop: 8 }}>⛔ Бессрочная блокировка</p>
          )}
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 12 }}>Для обжалования обратитесь к администратору</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text2)' }}>Ошибка загрузки. Перезапустите приложение.</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AppContext.Provider value={{ user, setUser, refreshUser }}>
        <Toaster position="top-center" toastOptions={{ style: { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
        <AdminPanel />
      </AppContext.Provider>
    );
  }

  const tabs = { home: Home, shop: Shop, referral: Referral, profile: Profile };
  const TabComponent = tabs[tab] || Home;

  return (
    <AppContext.Provider value={{ user, setUser, refreshUser }}>
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
      <div className="page">
        <div className="scroll-area">
          <TabComponent />
        </div>
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </AppContext.Provider>
  );
}
