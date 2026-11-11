import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthProvider, createAuthClient, useAuth } from '@goodmorning/gm-auth';

type Review = {
  id: number;
  title: string;
  body: string;
  rating: number;
  product_title: string;
  product_handle: string;
  reviewer_name: string;
  created_at: string | null;
  published: boolean;
};

type ReviewList = { reviews: Review[]; page: number; per_page: number };
type Tab = 'pending' | 'published';

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const authClient = createAuthClient(apiUrl);

function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auth.login(email, password);
    } catch {
      // AuthProvider exposes a safe, user-facing error.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <Brand />
        <p className="eyebrow">Panel de reseñas</p>
        <h1>Hola de nuevo.</h1>
        <p className="login-copy">Inicia sesión para revisar y publicar reseñas en tu tienda.</p>
        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          {auth.error && <p className="error-message" role="alert">No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.</p>}
          <button className="button button-primary login-submit" type="submit" disabled={submitting}>{submitting ? 'Entrando…' : 'Iniciar sesión'}<span aria-hidden="true">↗</span></button>
        </form>
        <p className="login-footnote">Acceso privado para el equipo de Manu</p>
      </section>
    </main>
  );
}

function Brand() {
  return <a className="brand" href="/" aria-label="Manu, inicio"><span className="brand-mark">m</span><span>manu<span className="brand-dot">.</span></span></a>;
}

function ReviewCard({ review, onPublish, busy }: { review: Review; onPublish: (id: number) => void; busy: boolean }) {
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha desconocida';
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
  return (
    <article className="review-card">
      <div className="review-topline">
        <div className="reviewer-avatar" aria-hidden="true">{review.reviewer_name.trim().charAt(0).toUpperCase() || 'C'}</div>
        <div className="reviewer-meta"><strong>{review.reviewer_name}</strong><span>{date}</span></div>
        <span className={`review-status ${review.published ? 'review-status-published' : 'review-status-pending'}`}><span aria-hidden="true">●</span>{review.published ? 'Publicada' : 'Pendiente'}</span>
      </div>
      <div className="review-rating" aria-label={`${rating} de 5 estrellas`}><span aria-hidden="true">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span><span className="rating-number">{rating}.0</span></div>
      <p className="product-name">{review.product_title}</p>
      {review.title && <h3>{review.title}</h3>}
      <p className="review-body">{review.body || 'Sin comentario escrito.'}</p>
      {!review.published && <div className="review-actions"><span className="publish-note">Publica esta reseña en tu tienda</span><button className="button button-dark" type="button" disabled={busy} onClick={() => onPublish(review.id)}>{busy ? 'Publicando…' : 'Publicar'}<span aria-hidden="true">↗</span></button></div>}
    </article>
  );
}

function ReviewDashboard() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<Review[]>([]);
  const [published, setPublished] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!auth.accessToken) return;
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${auth.accessToken}` };
      const [pendingResponse, publishedResponse] = await Promise.all([
        fetch(`${apiUrl}/reviews?published=false`, { headers }),
        fetch(`${apiUrl}/reviews?published=true`, { headers }),
      ]);
      if (!pendingResponse.ok || !publishedResponse.ok) {
        const failed = !pendingResponse.ok ? pendingResponse : publishedResponse;
        const payload = await failed.json().catch(() => null) as { detail?: string } | null;
        throw new Error(payload?.detail || 'No pudimos cargar las reseñas.');
      }
      const [pendingData, publishedData] = await Promise.all([pendingResponse.json(), publishedResponse.json()]) as [ReviewList, ReviewList];
      setPending(pendingData.reviews);
      setPublished(publishedData.reviews);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ocurrió un error al cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => { void load(); }, [load]);

  async function publish(id: number) {
    if (!auth.accessToken || !window.confirm('¿Publicar esta reseña en tu tienda Shopify?')) return;
    setBusyId(id);
    setNotice('');
    setError('');
    try {
      const response = await fetch(`${apiUrl}/reviews/${id}/publish`, { method: 'POST', headers: { Authorization: `Bearer ${auth.accessToken}` } });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(payload?.detail || 'No se pudo publicar la reseña.');
      }
      setNotice('Reseña publicada.');
      await load();
      setTab('published');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo publicar la reseña.');
    } finally {
      setBusyId(null);
    }
  }

  const currentReviews = tab === 'pending' ? pending : published;
  const filteredReviews = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return currentReviews;
    return currentReviews.filter((review) => `${review.reviewer_name} ${review.product_title} ${review.title} ${review.body}`.toLocaleLowerCase('es-MX').includes(normalized));
  }, [currentReviews, query]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-right"><span className="shop-pill"><span className="connection-dot" />Judge.me</span><button className="icon-button" type="button" aria-label="Actualizar reseñas" onClick={() => void load()} disabled={loading}>↻</button><div className="user-chip"><span className="user-avatar">{(auth.identity?.name || auth.identity?.email || 'M').charAt(0).toUpperCase()}</span><span className="user-name">{auth.identity?.name || auth.identity?.email}</span><button type="button" className="logout-button" onClick={() => void auth.logout()}>Salir</button></div></div>
      </header>

      <section className="workspace">
        <div className="welcome-row"><div><p className="eyebrow">Tu espacio de reseñas</p><h1>Opiniones que hacen crecer.</h1><p className="subtitle">Revisa el feedback de tus clientes y decide qué compartir en tu tienda.</p></div><div className="welcome-mark" aria-hidden="true">✳</div></div>

        <div className="summary-grid" aria-label="Resumen de reseñas">
          <article className="summary-card summary-pending"><span className="summary-icon">◷</span><span className="summary-label">Por revisar</span><strong>{loading ? '—' : pending.length}</strong><span className="summary-caption">Esperando tu aprobación</span></article>
          <article className="summary-card summary-published"><span className="summary-icon">↗</span><span className="summary-label">En tu tienda</span><strong>{loading ? '—' : published.length}</strong><span className="summary-caption">Reseñas publicadas</span></article>
          <article className="summary-card summary-rating"><span className="summary-icon">✳</span><span className="summary-label">Calificación promedio</span><strong>{published.length ? (published.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / published.length).toFixed(1) : '—'}<small>{published.length ? ' / 5' : ''}</small></strong><span className="summary-caption">Entre las publicadas</span></article>
        </div>

        <section className="reviews-panel" aria-labelledby="reviews-heading">
          <div className="panel-heading"><div><p className="eyebrow">Moderación</p><h2 id="reviews-heading">Tus reseñas</h2></div><label className="search-box"><span aria-hidden="true">⌕</span><span className="sr-only">Buscar reseñas</span><input type="search" placeholder="Buscar reseñas" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
          <div className="tabs" role="tablist" aria-label="Estado de las reseñas">
            <button type="button" role="tab" aria-selected={tab === 'pending'} className={tab === 'pending' ? 'tab active' : 'tab'} onClick={() => setTab('pending')}>Por revisar <span>{pending.length}</span></button>
            <button type="button" role="tab" aria-selected={tab === 'published'} className={tab === 'published' ? 'tab active' : 'tab'} onClick={() => setTab('published')}>Publicadas <span>{published.length}</span></button>
          </div>
          {notice && <p className="success-message" role="status">{notice}</p>}
          {error && <div className="error-banner" role="alert"><span className="error-mark">!</span><div><strong>No pudimos conectar con Judge.me</strong><p>{error}</p></div><button type="button" onClick={() => void load()}>Reintentar</button></div>}
          {loading ? <div className="empty-state"><span className="loading-spinner" /><p>Cargando tus reseñas…</p></div> : !error && filteredReviews.length === 0 ? <div className="empty-state"><span className="empty-mark">✳</span><h3>{query ? 'No encontramos coincidencias' : tab === 'pending' ? 'Todo al día' : 'Todavía no hay reseñas publicadas'}</h3><p>{query ? 'Prueba con otro nombre o producto.' : tab === 'pending' ? 'Cuando haya nuevas reseñas, aparecerán aquí.' : 'Las reseñas que publiques aparecerán en esta pestaña.'}</p></div> : !error && <div className="review-list">{filteredReviews.map((review) => <ReviewCard key={review.id} review={review} onPublish={(id) => void publish(id)} busy={busyId === review.id} />)}</div>}
          <p className="panel-footnote">Los datos se sincronizan directamente con Judge.me. Las reseñas se publican una por una.</p>
        </section>
        <footer className="footer-note"><span>Hecho para dar voz a tus clientes.</span><span>Manu · Shopify reviews</span></footer>
      </section>
    </main>
  );
}

function AccessGate() {
  const auth = useAuth();
  if (!auth.identity) return <LoginScreen />;
  if (!auth.identity.roles.includes('admin')) return <main className="login-shell"><section className="login-card"><Brand /><p className="error-message" role="alert">Esta cuenta no tiene acceso al panel de reseñas.</p><button className="button button-dark" onClick={() => void auth.logout()}>Cerrar sesión</button></section></main>;
  return <ReviewDashboard />;
}

function App() {
  return <AuthProvider client={authClient}><AccessGate /></AuthProvider>;
}

export default App;
