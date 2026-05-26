import { useState, useEffect } from 'react';

export default function Shop({ user, onRefresh, showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const buy = async (product) => {
    if (user.balance < product.price) {
      showToast('❌ Недостаточно звёзд');
      return;
    }
    setBuying(product.id);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.telegram_id, product_id: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Куплено: ${product.emoji} ${product.name}`);
        onRefresh();
      } else {
        showToast('❌ ' + (data.error || 'Ошибка'));
      }
    } catch {
      showToast('❌ Ошибка сети');
    } finally {
      setBuying(null);
    }
  };

  const activatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.telegram_id, code: promoCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 +${data.stars_amount} ⭐ зачислено!`);
        setPromoCode('');
        onRefresh();
      } else {
        showToast('❌ ' + (data.error || 'Неверный промокод'));
      }
    } catch {
      showToast('❌ Ошибка');
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
        borderRadius: 16, padding: '16px 20px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Привет, {user.first_name}!</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{user.balance} ⭐</div>
        </div>
        <div style={{ fontSize: 36 }}>🛍</div>
      </div>

      {/* Promo */}
      <div style={{
        background: '#1a1a2e', borderRadius: 12, padding: '12px',
        marginBottom: 16, display: 'flex', gap: 8,
      }}>
        <input
          value={promoCode}
          onChange={e => setPromoCode(e.target.value.toUpperCase())}
          placeholder="Промокод"
          style={{
            flex: 1, background: '#0f0f1a', color: '#fff',
            padding: '10px 14px', borderRadius: 10, fontSize: 14,
            border: '1px solid #2a2a4a',
          }}
        />
        <button onClick={activatePromo} disabled={promoLoading} style={{
          background: '#6C63FF', color: '#fff', padding: '10px 16px',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          opacity: promoLoading ? 0.6 : 1,
        }}>
          {promoLoading ? '...' : '✓'}
        </button>
      </div>

      {/* Products */}
      <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>Товары</div>
      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: '#1a1a2e', borderRadius: 16, padding: '16px 12px',
              textAlign: 'center', border: '1px solid #2a2a4a',
            }}>
              <div style={{ fontSize: 42, marginBottom: 6 }}>{p.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
              {p.description && (
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{p.description}</div>
              )}
              <button
                onClick={() => buy(p)}
                disabled={buying === p.id}
                style={{
                  background: user.balance >= p.price ? '#6C63FF' : '#333',
                  color: '#fff', padding: '8px 0', width: '100%',
                  borderRadius: 10, fontWeight: 600, fontSize: 13,
                  opacity: buying === p.id ? 0.6 : 1,
                }}
              >
                {buying === p.id ? '...' : `${p.price} ⭐`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
