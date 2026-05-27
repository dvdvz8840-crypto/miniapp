import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, ShoppingBag, Users, Edit2, Trash2, X, Trophy, Tag, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const navTabs = [
  { id: 'orders', label: 'Заказы', Icon: ShoppingBag },
  { id: 'products', label: 'Товары', Icon: Package },
  { id: 'users', label: 'Юзеры', Icon: Users },
  { id: 'giveaways', label: 'Розыгрыши', Icon: Trophy },
  { id: 'promo', label: 'Промокоды', Icon: Tag },
  { id: 'bans', label: 'Баны', Icon: Shield },
];

function getAdminId() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 999999999;
}

async function aFetch(path, opts = {}) {
  const isFormData = opts.body instanceof FormData;
  return fetch(path, {
    ...opts,
    headers: {
      'x-user-id': getAdminId(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(opts.headers || {}),
    },
  });
}

// ─── Field ────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</p>
      {children}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      {...props}
      style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', color: 'white', fontSize: 14, fontFamily: 'inherit', outline: 'none', ...style }}
    />
  );
}

function Btn({ children, style, variant = 'primary', ...props }) {
  const styles = {
    primary: { background: 'linear-gradient(135deg, var(--accent), #9d96ff)', color: 'white' },
    gold: { background: 'linear-gradient(135deg, var(--gold), #ffb347)', color: '#1a1000' },
    danger: { background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b' },
    success: { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' },
    ghost: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' },
  };
  return (
    <motion.button whileTap={{ scale: 0.94 }} {...props}
      style={{ borderRadius: 12, padding: '11px 16px', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', ...styles[variant], width: '100%', ...style }}>
      {children}
    </motion.button>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────
function Sheet({ onClose, title, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 500, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} onClick={e => e.stopPropagation()}
        style={{ background: 'var(--card2)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border)', width: '100%', maxHeight: '90dvh', overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '12px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="var(--text2)" />
          </button>
        </div>
        <div style={{ padding: '12px 20px 0' }}>{children}</div>
      </motion.div>
    </div>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    aFetch('/admin/orders').then(r => r.json()).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    await aFetch(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    toast.success('Статус обновлён');
    load();
  };

  const statusColor = { pending: '#FFD700', delivered: '#4ade80', cancelled: '#ff6b6b' };
  const statusLabel = { pending: '⏳ Ожидает', delivered: '✓ Доставлен', cancelled: '✕ Отменён' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Заказы ({orders.length})</h2>
        <Btn onClick={load} variant="ghost" style={{ width: 'auto', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5 }}><RefreshCw size={13} /> Обновить</Btn>
      </div>
      {loading ? <div className="shimmer" style={{ height: 200, borderRadius: 16 }} /> :
        orders.length === 0 ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Заказов пока нет</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(o => (
              <div key={o.id} style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{o.emoji} {o.product_name}</p>
                    <p style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>@{o.username || o.first_name || o.user_id} · {new Date(o.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 800 }}>{o.total_price} ⭐</p>
                    <p style={{ fontSize: 11, color: statusColor[o.status] }}>{statusLabel[o.status] || o.status}</p>
                  </div>
                </div>
                {o.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="success" style={{ fontSize: 12 }} onClick={() => updateStatus(o.id, 'delivered')}>✓ Доставить</Btn>
                    <Btn variant="danger" style={{ fontSize: 12 }} onClick={() => updateStatus(o.id, 'cancelled')}>✕ Отменить</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────
function ProductForm({ product, onSave, onClose }) {
  const [form, setForm] = useState({ name: product?.name || '', description: product?.description || '', price: product?.price || '', stock: product?.stock ?? -1, is_active: product?.is_active ?? 1, emoji: product?.emoji || '🎁' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.price) { toast.error('Заполните название и цену'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      const res = await aFetch(product ? `/admin/products/${product.id}` : '/admin/products', { method: product ? 'PUT' : 'POST', body: fd });
      const data = await res.json();
      if (data.success || data.product) { toast.success(product ? 'Сохранено' : 'Добавлен'); onSave(); onClose(); }
      else toast.error(data.error || 'Ошибка');
    } catch { toast.error('Ошибка'); }
    setLoading(false);
  };

  return (
    <Sheet onClose={onClose} title={product ? 'Редактировать товар' : 'Новый товар'}>
      <Field label="Название *"><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Плюшевый мишка" /></Field>
      <Field label="Описание"><Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Описание товара" /></Field>
      <Field label="Эмодзи"><Input value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🎁" style={{ fontSize: 24, textAlign: 'center' }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Field label="Цена (звёзды) *"><Input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="15" /></Field>
        <Field label="Лимит (-1 = ∞)"><Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="-1" /></Field>
      </div>
      <Field label="Статус">
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 1, l: '✓ Активен' }, { v: 0, l: '✕ Скрыт' }].map(({ v, l }) => (
            <button key={v} onClick={() => set('is_active', v)} style={{ flex: 1, padding: '10px', borderRadius: 12, fontWeight: 600, fontSize: 13, fontFamily: 'inherit', background: form.is_active === v ? (v ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,107,0.15)') : 'var(--bg2)', border: `1px solid ${form.is_active === v ? (v ? 'rgba(74,222,128,0.4)' : 'rgba(255,107,107,0.4)') : 'var(--border)'}`, color: form.is_active === v ? (v ? '#4ade80' : '#ff6b6b') : 'var(--text2)' }}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="Картинка">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} style={{ width: '100%', background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: 12, padding: '14px', color: 'var(--text2)', fontSize: 13, fontFamily: 'inherit' }}>
          {file ? `✓ ${file.name}` : '📷 Выбрать изображение'}
        </button>
      </Field>
      <Btn onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>{loading ? 'Сохранение...' : (product ? 'Сохранить изменения' : '+ Добавить товар')}</Btn>
    </Sheet>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => { setLoading(true); aFetch('/admin/products').then(r => r.json()).then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const deleteProduct = async (id, hard = false) => {
    await aFetch(`/admin/products/${id}${hard ? '/hard' : ''}`, { method: 'DELETE' });
    toast.success(hard ? 'Товар удалён' : 'Товар скрыт');
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Товары ({products.length})</h2>
        <Btn onClick={() => { setEditing(null); setShowForm(true); }} variant="primary" style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={14} /> Добавить</Btn>
      </div>
      {loading ? <div className="shimmer" style={{ height: 200, borderRadius: 16 }} /> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', borderRadius: 14, border: `1px solid ${p.is_active ? 'var(--border)' : 'rgba(255,107,107,0.25)'}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: p.is_active ? 1 : 0.6 }}>
              <div style={{ width: 44, height: 44, background: 'var(--bg2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} alt="" /> : p.emoji || '🎁'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>{p.price} ⭐ · {p.stock === -1 ? '∞' : `${p.stock} шт.`}{!p.is_active ? ' · Скрыт' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ width: 34, height: 34, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={13} color="var(--accent2)" /></button>
                <button onClick={() => { if (confirm(`Скрыть "${p.name}"?`)) deleteProduct(p.id); }} style={{ width: 34, height: 34, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} color="#ff6b6b" /></button>
              </div>
            </div>
          ))}
        </div>
      }
      {showForm && <ProductForm product={editing} onSave={load} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────
function BanForm({ user: u, onDone, onClose }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const ban = async () => {
    setLoading(true);
    let bannedUntil = null;
    if (duration) {
      const d = new Date();
      const [num, unit] = [parseInt(duration), duration.replace(/\d/g, '').trim()];
      if (unit === 'ч') d.setHours(d.getHours() + num);
      else if (unit === 'д') d.setDate(d.getDate() + num);
      else if (unit === 'н') d.setDate(d.getDate() + num * 7);
      else if (unit === 'м') d.setMonth(d.getMonth() + num);
      else bannedUntil = null;
      if (unit) bannedUntil = d.toISOString();
    }
    await aFetch(`/admin/users/${u.telegram_id}/ban`, { method: 'POST', body: JSON.stringify({ reason, banned_until: bannedUntil }) });
    toast.success('Пользователь заблокирован');
    setLoading(false);
    onDone();
    onClose();
  };

  return (
    <Sheet onClose={onClose} title={`Заблокировать: ${u.first_name}`}>
      <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>ID: <strong style={{ color: 'white' }}>{u.telegram_id}</strong>{u.username ? ` · @${u.username}` : ''}</p>
      </div>
      <Field label="Причина блокировки">
        <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Напр. Спам, мошенничество..." />
      </Field>
      <Field label="Срок (пусто = навсегда)">
        <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Напр. 7д, 24ч, 1м, 2н" />
        <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>ч — часы, д — дни, н — недели, м — месяцы. Пусто = бессрочно</p>
      </Field>
      <Btn variant="danger" onClick={ban} disabled={loading} style={{ marginTop: 4 }}>{loading ? 'Блокировка...' : '🚫 Заблокировать'}</Btn>
    </Sheet>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(null);

  const load = () => { setLoading(true); aFetch('/admin/users').then(r => r.json()).then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const addBalance = async (userId) => {
    const amount = prompt('Сколько звёзд добавить?');
    if (!amount || isNaN(amount)) return;
    await aFetch(`/admin/users/${userId}/balance`, { method: 'POST', body: JSON.stringify({ amount: parseInt(amount) }) });
    toast.success(`+${amount} ⭐ добавлено`);
    load();
  };

  const unban = async (userId) => {
    await aFetch(`/admin/users/${userId}/unban`, { method: 'POST', body: JSON.stringify({}) });
    toast.success('Разблокирован');
    load();
  };

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Пользователи ({users.length})</h2>
      {loading ? <div className="shimmer" style={{ height: 200, borderRadius: 16 }} /> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <div key={u.telegram_id} style={{ background: 'var(--card)', borderRadius: 14, border: `1px solid ${u.is_banned ? 'rgba(255,107,107,0.3)' : 'var(--border)'}`, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #ff6b9d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                  {(u.first_name || u.username || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.first_name || ''} {u.last_name || ''}{u.username ? ` (@${u.username})` : ''}</p>
                    {u.is_banned && <span style={{ fontSize: 10, background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 30, padding: '2px 6px', flexShrink: 0 }}>БАН</span>}
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>{u.balance} ⭐ · {u.total_deposited ?? 0} деп. · {u.referrals_count} реф. · #{u.telegram_id}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => addBalance(u.telegram_id)} style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}>+⭐ Баланс</button>
                {u.is_banned ? (
                  <button onClick={() => unban(u.telegram_id)} style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>✓ Разбанить</button>
                ) : (
                  <button onClick={() => setBanning(u)} style={{ flex: 1, padding: '7px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b' }}>🚫 Забанить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      }
      {banning && <BanForm user={banning} onDone={load} onClose={() => setBanning(null)} />}
    </div>
  );
}

// ─── GIVEAWAYS TAB ────────────────────────────────────────────
function GiveawayForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', prize: '', ends_at: '', channel_username: '', min_deposit: '0', conditions_text: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const create = async () => {
    if (!form.title) { toast.error('Введите название'); return; }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('photo', file);
    try {
      const res = await aFetch('/admin/giveaways', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { toast.success('Розыгрыш создан!'); onSave(); onClose(); }
      else toast.error(data.error || 'Ошибка');
    } catch { toast.error('Ошибка'); }
    setLoading(false);
  };

  return (
    <Sheet onClose={onClose} title="Новый розыгрыш">
      <Field label="Название *"><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Еженедельный розыгрыш" /></Field>
      <Field label="Описание"><Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Описание розыгрыша..." /></Field>
      <Field label="Приз"><Input value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="Напр. 500 ⭐ или 🐻 Мишка" /></Field>
      <Field label="Условия (текст)"><Input value={form.conditions_text} onChange={e => set('conditions_text', e.target.value)} placeholder="Напр. Подписка + депозит 50 ⭐" /></Field>
      <Field label="Канал для подписки (без @)"><Input value={form.channel_username} onChange={e => set('channel_username', e.target.value)} placeholder="myChannel" /></Field>
      <Field label="Мин. депозит (⭐)"><Input type="number" value={form.min_deposit} onChange={e => set('min_deposit', e.target.value)} placeholder="0" /></Field>
      <Field label="Дата окончания"><Input type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} /></Field>
      <Field label="Фото розыгрыша">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} style={{ width: '100%', background: 'var(--bg2)', border: '1px dashed var(--border)', borderRadius: 12, padding: '14px', color: 'var(--text2)', fontSize: 13, fontFamily: 'inherit' }}>
          {file ? `✓ ${file.name}` : '🖼 Выбрать фото'}
        </button>
      </Field>
      <Btn variant="gold" onClick={create} disabled={loading}>{loading ? 'Создание...' : '🏆 Создать розыгрыш'}</Btn>
    </Sheet>
  );
}

function GiveawaysTab() {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => { setLoading(true); aFetch('/admin/giveaways').then(r => r.json()).then(d => { setGiveaways(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const draw = async (id) => {
    const res = await aFetch(`/admin/giveaways/${id}/draw`, { method: 'POST', body: JSON.stringify({}) });
    const data = await res.json();
    if (data.success) toast.success(`Победитель: ${data.winner?.first_name || data.winner?.username || data.winner?.telegram_id}`);
    else toast.error(data.error || 'Ошибка');
    load();
  };

  const close = async (id) => { await aFetch(`/admin/giveaways/${id}`, { method: 'DELETE' }); toast.success('Розыгрыш завершён'); load(); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Розыгрыши ({giveaways.length})</h2>
        <Btn onClick={() => setShowForm(true)} variant="gold" style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={14} /> Создать</Btn>
      </div>
      {loading ? <div className="shimmer" style={{ height: 200, borderRadius: 16 }} /> :
        giveaways.length === 0 ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Нет розыгрышей</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {giveaways.map(g => (
              <div key={g.id} style={{ background: 'var(--card)', borderRadius: 16, border: `1px solid ${g.is_active ? 'rgba(255,215,0,0.2)' : 'var(--border)'}`, overflow: 'hidden', opacity: g.is_active ? 1 : 0.6 }}>
                {g.photo_url && <img src={g.photo_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{g.title}</p>
                      <p style={{ color: 'var(--text2)', fontSize: 12 }}>Приз: {g.prize || '—'} · {g.entries_count} участников</p>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 30, background: g.is_active ? 'rgba(74,222,128,0.12)' : 'rgba(255,107,107,0.1)', color: g.is_active ? '#4ade80' : '#ff6b6b', border: `1px solid ${g.is_active ? 'rgba(74,222,128,0.3)' : 'rgba(255,107,107,0.2)'}` }}>
                      {g.is_active ? 'Активен' : 'Завершён'}
                    </span>
                  </div>
                  {g.channel_username && <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>📢 @{g.channel_username}</p>}
                  {g.min_deposit > 0 && <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>💰 Мин. депозит: {g.min_deposit} ⭐</p>}
                  {g.ends_at && <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>⏰ До {new Date(g.ends_at).toLocaleString('ru-RU')}</p>}
                  {g.is_active && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn variant="gold" style={{ fontSize: 12, padding: '8px' }} onClick={() => draw(g.id)}>🎲 Разыграть</Btn>
                      <Btn variant="danger" style={{ fontSize: 12, padding: '8px' }} onClick={() => close(g.id)}>Завершить</Btn>
                    </div>
                  )}
                  {!g.is_active && g.winner_id && <p style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>🏆 Победитель ID: {g.winner_id}</p>}
                </div>
              </div>
            ))}
          </div>
      }
      {showForm && <GiveawayForm onSave={load} onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ─── PROMO TAB ────────────────────────────────────────────────
function PromoTab() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', stars_amount: '', max_activations: '-1', expires_at: '' });
  const [creating, setCreating] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => { setLoading(true); aFetch('/admin/promo').then(r => r.json()).then(d => { setPromos(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const create = async () => {
    if (!form.code || !form.stars_amount) { toast.error('Заполните код и бонус'); return; }
    setCreating(true);
    try {
      const res = await aFetch('/admin/promo', { method: 'POST', body: JSON.stringify({ code: form.code.toUpperCase(), stars_amount: parseInt(form.stars_amount), max_activations: parseInt(form.max_activations), expires_at: form.expires_at || null }) });
      const data = await res.json();
      if (data.success) { toast.success('Промокод создан!'); setForm({ code: '', stars_amount: '', max_activations: '-1', expires_at: '' }); setShowForm(false); load(); }
      else toast.error(data.error || 'Ошибка');
    } catch { toast.error('Ошибка'); }
    setCreating(false);
  };

  const deletePromo = async (id) => { await aFetch(`/admin/promo/${id}`, { method: 'DELETE' }); toast.success('Промокод деактивирован'); load(); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Промокоды ({promos.length})</h2>
        <Btn onClick={() => setShowForm(!showForm)} variant="primary" style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={14} /> Создать</Btn>
      </div>

      {showForm && (
        <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 16 }}>
          <Field label="Код *"><Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="PROMO2024" style={{ textTransform: 'uppercase', letterSpacing: 1 }} /></Field>
          <Field label="Бонус (звёзды) *"><Input type="number" value={form.stars_amount} onChange={e => set('stars_amount', e.target.value)} placeholder="50" /></Field>
          <Field label="Макс. активаций (-1 = ∞)"><Input type="number" value={form.max_activations} onChange={e => set('max_activations', e.target.value)} placeholder="-1" /></Field>
          <Field label="Истекает (необязательно)"><Input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} /></Field>
          <Btn onClick={create} disabled={creating}>{creating ? 'Создание...' : '🏷 Создать промокод'}</Btn>
        </div>
      )}

      {loading ? <div className="shimmer" style={{ height: 120, borderRadius: 16 }} /> :
        promos.length === 0 ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Промокодов нет</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {promos.map(p => (
              <div key={p.id} style={{ background: 'var(--card)', borderRadius: 14, border: `1px solid ${p.is_active ? 'var(--border)' : 'rgba(255,107,107,0.2)'}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: p.is_active ? 1 : 0.5 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>{p.code}</p>
                    {!p.is_active && <span style={{ fontSize: 10, color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 30, padding: '1px 6px' }}>неактивен</span>}
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
                    +{p.stars_amount} ⭐ · {p.activations_count}/{p.max_activations === -1 ? '∞' : p.max_activations} активаций
                    {p.expires_at ? ` · до ${new Date(p.expires_at).toLocaleDateString('ru-RU')}` : ''}
                  </p>
                </div>
                {p.is_active && (
                  <button onClick={() => deletePromo(p.id)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} color="#ff6b6b" />
                  </button>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─── BANS TAB ─────────────────────────────────────────────────
function BansTab() {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); aFetch('/admin/bans').then(r => r.json()).then(d => { setBans(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const unban = async (id) => { await aFetch(`/admin/users/${id}/unban`, { method: 'POST', body: JSON.stringify({}) }); toast.success('Разблокирован'); load(); };

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Заблокированные ({bans.length})</h2>
      {loading ? <div className="shimmer" style={{ height: 200, borderRadius: 16 }} /> :
        bans.length === 0 ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Нет заблокированных</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bans.map(b => {
              const isPermanent = !b.banned_until;
              const until = b.banned_until ? new Date(b.banned_until) : null;
              return (
                <div key={b.id} style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid rgba(255,107,107,0.25)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{b.first_name || b.username || `ID ${b.telegram_id}`}{b.username ? ` (@${b.username})` : ''}</p>
                    <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 2 }}>{b.reason || 'Без причины'}</p>
                    <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 2 }}>{isPermanent ? '⛔ Бессрочно' : `До ${until.toLocaleString('ru-RU')}`}</p>
                  </div>
                  <button onClick={() => unban(b.telegram_id)} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>✓ Разбанить</button>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState('orders');
  const tabMap = { orders: OrdersTab, products: ProductsTab, users: UsersTab, giveaways: GiveawaysTab, promo: PromoTab, bans: BansTab };
  const TabComp = tabMap[tab];

  return (
    <div className="page">
      <div style={{ padding: '16px 16px 0', background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg) 100%)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>👑</span>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Админ-панель</h1>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
          {navTabs.map(({ id, label, Icon }) => (
            <motion.button key={id} whileTap={{ scale: 0.93 }} onClick={() => setTab(id)}
              style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? 'var(--accent)' : 'var(--card)', color: tab === id ? 'white' : 'var(--text2)', border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon size={12} /> {label}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="scroll-area" style={{ padding: '16px', paddingBottom: 40 }}>
        <TabComp />
      </div>
    </div>
  );
}
