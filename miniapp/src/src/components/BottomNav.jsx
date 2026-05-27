import { motion } from 'framer-motion';
import { Home, ShoppingBag, Users, User } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Главная', Icon: Home },
  { id: 'shop', label: 'Магазин', Icon: ShoppingBag },
  { id: 'referral', label: 'Рефералка', Icon: Users },
  { id: 'profile', label: 'Профиль', Icon: User },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 100, padding: '0 12px 12px',
    }}>
      <div style={{
        background: 'rgba(19,19,42,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        border: '1px solid var(--border)',
        display: 'flex',
        padding: '8px 4px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.1)',
      }}>
        {tabs.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.9 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                background: active ? 'rgba(108,99,255,0.18)' : 'transparent',
                borderRadius: 20,
                transition: 'background 0.2s',
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.25), rgba(157,150,255,0.15))',
                    border: '1px solid rgba(108,99,255,0.3)',
                  }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
              <Icon
                size={22}
                color={active ? '#9d96ff' : 'rgba(255,255,255,0.4)'}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ position: 'relative', zIndex: 1, transition: 'color 0.2s' }}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? '#9d96ff' : 'rgba(255,255,255,0.4)',
                position: 'relative', zIndex: 1, transition: 'color 0.2s',
                letterSpacing: '-0.2px',
              }}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
