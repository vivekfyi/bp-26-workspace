'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';

type Topic = { slug: string; name: string };
type Feed = {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  category: string;
  language: string;
  trustScore: number;
  licenseType: string;
  isActive: boolean;
  lastPolledAt?: string | null;
  topics: Topic[];
  _count?: { articles: number };
};

const emptyForm = { name: '', feedUrl: '', siteUrl: '', category: 'Technology', language: 'en', trustScore: 80, licenseType: 'MIXED_UNKNOWN', topicSlugs: [] as string[] };

export default function AdminFeedsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feedResponse, topicResponse] = await Promise.all([
        fetch('/api/sources?page=1&limit=100', { cache: 'no-store' }),
        fetch('/api/sources/topics', { cache: 'no-store' }),
      ]);
      if (!feedResponse.ok || !topicResponse.ok) throw new Error('Could not load feed settings.');
      const feedData = await feedResponse.json();
      setFeeds(feedData.items ?? []);
      setTopics(await topicResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load feed settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = await getToken();
    if (!token) throw new Error('Your Clerk session is not ready. Please try again.');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }

  function resetForm() { setForm(emptyForm); setEditingId(null); setError(''); }

  function editFeed(feed: Feed) {
    setEditingId(feed.id);
    setForm({ name: feed.name, feedUrl: feed.feedUrl, siteUrl: feed.siteUrl, category: feed.category, language: feed.language, trustScore: feed.trustScore, licenseType: feed.licenseType, topicSlugs: feed.topics.map((topic) => topic.slug) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleTopic(slug: string) {
    setForm((current) => ({ ...current, topicSlugs: current.topicSlugs.includes(slug) ? current.topicSlugs.filter((item) => item !== slug) : [...current.topicSlugs, slug] }));
  }

  async function saveFeed(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await authenticatedFetch(editingId ? `/api/sources/${editingId}` : '/api/sources', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'Could not save feed.');
      setMessage(editingId ? 'Feed updated.' : 'Feed added.'); resetForm(); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Could not save feed.'); }
    finally { setSaving(false); }
  }

  async function removeFeed(feed: Feed) {
    if (!window.confirm(`Delete ${feed.name}? Its imported articles will also be removed.`)) return;
    setError(''); setMessage('');
    try {
      const response = await authenticatedFetch(`/api/sources/${feed.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? `Delete failed (${response.status}).`);
      setMessage('Feed deleted.'); await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete feed.');
    }
  }

  async function toggleActive(feed: Feed) {
    const response = await authenticatedFetch(`/api/sources/${feed.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !feed.isActive }) });
    if (!response.ok) { setError('Could not update feed status.'); return; }
    await load();
  }

  async function syncFeeds() {
    setSyncing(true); setError(''); setMessage('');
    try { const response = await authenticatedFetch('/api/sources/sync', { method: 'POST' }); if (!response.ok) throw new Error('Sync failed.'); setMessage('Feed sync completed.'); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Sync failed.'); }
    finally { setSyncing(false); }
  }

  return <main className="admin-shell">
    <header className="admin-header"><a className="brand" href="/"><span className="brand-mark">SZ</span><span>Scroll Zero</span></a><div className="admin-header-actions"><span className="admin-user">{user?.primaryEmailAddress?.emailAddress}</span><UserButton /><a className="quiet-link" href="/">Back to reading room ↗</a></div></header>
    <section className="admin-hero"><div><p className="eyebrow">Admin · Sources</p><h1>Manage your<br /><em>signal.</em></h1><p>Keep the reading room focused by choosing exactly which feeds are active.</p></div><button className="button button-dark" onClick={syncFeeds} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync all feeds'}</button></section>
    {message ? <div className="admin-success">{message}</div> : null}{error ? <div className="notice">{error}</div> : null}
    <section className="admin-grid">
      <form className="feed-form" onSubmit={saveFeed}><div className="section-heading"><div><p className="eyebrow">{editingId ? 'Edit source' : 'New source'}</p><h2>{editingId ? 'Update a feed' : 'Add a feed'}</h2></div>{editingId ? <button type="button" className="text-button" onClick={resetForm}>Cancel</button> : null}</div>
        <label>Feed name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="The Verge" /></label>
        <label>RSS / Atom URL<input required type="url" value={form.feedUrl} onChange={(event) => setForm({ ...form, feedUrl: event.target.value })} placeholder="https://example.com/feed.xml" /></label>
        <label>Website URL<input required type="url" value={form.siteUrl} onChange={(event) => setForm({ ...form, siteUrl: event.target.value })} placeholder="https://example.com" /></label>
        <div className="form-row"><label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Trust score<input type="number" min="0" max="100" value={form.trustScore} onChange={(event) => setForm({ ...form, trustScore: Number(event.target.value) })} /></label></div>
        <label>License<select value={form.licenseType} onChange={(event) => setForm({ ...form, licenseType: event.target.value })}><option value="MIXED_UNKNOWN">Mixed / unknown</option><option value="CC_BY">CC BY</option><option value="CC0">CC0</option><option value="OPEN_GOV">Open government</option><option value="PUBLIC_DOMAIN">Public domain</option></select></label>
        <fieldset><legend>Topics</legend><div className="topic-picker">{topics.map((topic) => <button type="button" key={topic.slug} className={`topic-chip ${form.topicSlugs.includes(topic.slug) ? 'selected' : ''}`} onClick={() => toggleTopic(topic.slug)}>{topic.name}</button>)}</div></fieldset>
        <button className="button button-dark form-submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add feed'}</button>
      </form>
      <section className="feed-list"><div className="section-heading"><div><p className="eyebrow">Source library</p><h2>{feeds.length} feeds</h2></div><span className="muted-mono">{feeds.filter((feed) => feed.isActive).length} active</span></div>{loading ? <div className="empty-state">Loading sources…</div> : feeds.length === 0 ? <div className="empty-state">No feeds yet. Add your first source.</div> : <div className="feed-table">{feeds.map((feed) => <article className={`feed-card ${feed.isActive ? '' : 'inactive'}`} key={feed.id}><div className="feed-card-main"><div className="feed-status"><span className="status-dot" />{feed.isActive ? 'Active' : 'Paused'}</div><h3>{feed.name}</h3><a href={feed.feedUrl} target="_blank" rel="noreferrer">{feed.feedUrl}</a><div className="feed-meta"><span>{feed.category}</span><span>{feed._count?.articles ?? 0} articles</span><span>{feed.topics.map((topic) => topic.name).join(' · ') || 'No topics'}</span></div></div><div className="feed-actions"><button className="text-button" onClick={() => editFeed(feed)}>Edit</button><button className="text-button" onClick={() => void toggleActive(feed)}>{feed.isActive ? 'Pause' : 'Activate'}</button><button className="text-button danger" onClick={() => void removeFeed(feed)}>Delete</button></div></article>)}</div>}</section>
    </section>
  </main>;
}
