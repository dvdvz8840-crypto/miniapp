import { useState, useEffect } from 'react';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${user.telegram_id}`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user.telegram_id]);

  const statusColor = { pending: '#FFB800', completed: '#00C853', cancelled: '#FF4444' };
  const statusLabel = { pending: 'В обработке', completed: 'Выполнен', cancelled: 'Отменён' };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📦 Мои заказы</div>
      {loading ? <div className="spinner" /> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div>Заказов пока нет</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <div key={o.id} style={{
              background: '#1a1a2e', borderRadius: 14, padding: '14px 16px',
              border: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.product_emoji} {o.product_name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                  {new Date(o.created_at).toLocaleDateString('ru-RU')} · {o.quantity} шт · {o.total_price} ⭐
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: statusColor[o.status] || '#888',
                background: (statusColor[o.status] || '#888') + '22',
                padding: '4px 10px', borderRadius: 20,
              }}>
                {statusLabel[o.status] || o.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
