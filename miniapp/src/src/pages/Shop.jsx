import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Package, Star, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../App.jsx';
import toast from 'react-hot-toast';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
});

const EMOJI_MAP = { bear: '🐻', diamond: '💎', rose: '🌹', cake: '🎂', star: '⭐', heart: '❤️', crown: '👑', fire: '🔥', default: '🎁' };

function getEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('мишк') || n.includes('медвед') || n.includes('bear')) return '🐻';
  if (n.includes('алмаз') || n.includes('diamond')) return '💎';
  if (n.includes('роза') || n.includes('rose')) return '🌹';
  if (n.includes('торт') || n.includes('cake')) return '🎂';
  if (n.includes('корон') || n.includes('crown')) return '👑';
  if (n.includes('сердц') || n.includes('heart')) return '❤️';
  if (n.includes('огонь') || n.includes('fire')) return '🔥';
  return '🎁';
}

function OrderModal({ order, product, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card2)', borderRadius: 28,
            border: '1px solid var(--border)', padding: '32px 24px',
            textAlign: 'center', maxWidth: 320, width: '100%',
            boxShadow: '0 20px 80px rgba(108,99,255,0.3)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}
          >
            {getEmoji(product?.name)}
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', bounce: 0.5 }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle size={26} color="#4ade80" />
          </motion.div>

          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Заказ оформлен!</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 6 }}>
            {product?.name}
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(108,99,255,0.15)', borderRadius: 30, padding: '6px 14px', marginBottom: 20,
          }}>
            <span>⭐</span>
            <span style={{ fontWeight: 700 }}>{order?.total_price}</span>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>звёзд</span>
          </div>

          <div style={{
            background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.2)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Clock size={18} color="#ff6b9d" />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Ожидайте доставку</p>
              <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                Администратор обработает ваш заказ в ближайшее время
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              width: '100%', background: 'linear-gradient(135deg, var(--accent), #9d96ff)',
              color: 'white', borderRadius: 14, padding: '13px',
              fontWeight: 700, fontSize: 15,
            }}
          >
            Отлично!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProductCard({ product, onBuy, i }) {
  const { user } = useApp();
  const canAfford = user && user.balance >= product.price;
  const inStock = product.stock === -1 || product.stock > 0;

  return (
    <motion.div {...fadeUp(i)} style={{
      background: 'var(--card)', borderRadius: 20,
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--card2), rgba(108,99,255,0.08))',
        height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 70, position: 'relative',
      }}>
        {product.image_url && !product.image_url.includes('placeholder') ? (
          <img src={product.image_url} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : null}
        <span style={{ position: 'relative', zIndex: 1 }}>{getEmoji(product.name)}</span>

        {product.stock !== -1 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: product.stock > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,107,0.15)',
            border: `1px solid ${product.stock > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,107,0.3)'}`,
            borderRadius: 30, padding: '3px 9px',
            fontSize: 11, fontWeight: 600,
            color: product.stock > 0 ? '#4ade80' : '#ff6b6b',
          }}>
            {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 14px' }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{product.name}</h3>
        {product.description && (
          <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{product.price}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onBuy(product)}
            disabled={!canAfford || !inStock}
            style={{
              background: canAfford && inStock
                ? 'linear-gradient(135deg, var(--accent), #9d96ff)'
                : 'rgba(255,255,255,0.06)',
              color: canAfford && inStock ? 'white' : 'var(--text3)',
              borderRadius: 30, padding: '9px 18px',
              fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            {!inStock ? 'Нет в наличии' : !canAfford ? 'Не хватает ⭐' : 'Купить'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Shop() {
  const { user, refreshUser } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderResult, setOrderResult] = useState(null);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => {
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleBuy = async (product) => {
    if (!user) return;
    setBuying(product.id);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.telegram_id, product_id: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderResult({ order: data, product });
        refreshUser();
      } else {
        toast.error(data.error || 'Ошибка при покупке');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div style={{ padding: '0 0 8px' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '56px 16px 20px',
          background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ShoppingBag size={22} color="var(--accent2)" />
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Магазин</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Ваш баланс: <strong style={{ color: 'white' }}>{user?.balance ?? 0} ⭐</strong>
        </p>
      </motion.div>

      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="shimmer" style={{ borderRadius: 20, height: 220 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)',
          }}>
            <Package size={48} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 600, fontSize: 16 }}>Товаров пока нет</p>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Загляните позже</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} onBuy={handleBuy} i={i} />
            ))}
          </div>
        )}
      </div>

      {orderResult && (
        <OrderModal
          order={orderResult.order}
          product={orderResult.product}
          onClose={() => setOrderResult(null)}
        />
      )}
    </div>
  );
}
