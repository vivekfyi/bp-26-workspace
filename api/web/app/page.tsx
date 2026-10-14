'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Topic = { slug: string; name: string };
type Source = { name: string; category?: string | null; licenseType?: string | null; siteUrl?: string | null; topics: Topic[] };
type Article = {
  id: string;
  title: string;
  originalUrl: string;
  author?: string | null;
  leadImageUrl?: string | null;
  summaryShort?: string | null;
  summaryBullets?: unknown;
  tags?: unknown;
  publishedAt?: string | null;
  readingTimeMinutes?: number | null;
  source: Source;
};
type ArticleDetail = Article & { fullText?: string | null };
type ArticleResponse = { items: Article[]; pagination: { total: number } };
type Health = { status: string; database: string; redis: string };

const categories = ['All', 'technology', 'science', 'business', 'culture'];

function formatDate(value?: string | null) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function paragraphs(value?: string | null) {
  return (value ?? '').split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState('');
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (category !== 'All') params.set('category', category);
      const response = await fetch(`/api/articles?${params.toString()}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('The reading queue is unavailable.');
      const data = (await response.json()) as ArticleResponse;
      setArticles(data.items ?? []);
      setTotal(data.pagination?.total ?? 0);
      setSelectedId((current) => current && data.items.some((article) => article.id === current) ? current : data.items[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof DOMException && requestError.name === 'AbortError' ? 'The article service did not respond. Check that the API is running, then try again.' : requestError instanceof Error ? requestError.message : 'Unable to load articles.');
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void loadArticles();
    void fetch('/api/health')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Health | null) => setHealth(data))
      .catch(() => setHealth(null));
  }, [loadArticles]);

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch('/api/sources/sync', { method: 'POST' });
      window.setTimeout(() => void loadArticles(), 1200);
    } finally {
      setSyncing(false);
    }
  }

  const visibleArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return articles;
    return articles.filter((article) =>
      [article.title, article.summaryShort, article.source.name, article.source.category, ...listValue(article.tags)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [articles, query]);

  const selectedArticle = visibleArticles.find((article) => article.id === selectedId) ?? visibleArticles[0] ?? null;
  const activeArticleId = selectedArticle?.id ?? null;

  useEffect(() => {
    if (!activeArticleId) {
      setArticleDetail(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setReaderLoading(true);
    setReaderError('');

    void fetch(`/api/articles/${activeArticleId}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Full article content is unavailable.');
        return (await response.json()) as ArticleDetail;
      })
      .then((data) => setArticleDetail(data))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          setReaderError('The full article did not respond. You can still open the original article.');
        } else {
          setReaderError(requestError instanceof Error ? requestError.message : 'Unable to load full article content.');
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setReaderLoading(false);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [activeArticleId]);

  const selectedBullets = listValue(articleDetail?.id === activeArticleId ? articleDetail.summaryBullets : selectedArticle?.summaryBullets);
  const selectedParagraphs = paragraphs(articleDetail?.id === activeArticleId ? articleDetail.fullText : null);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">SZ</span><span>Scroll Zero</span></a>
        <div className="topbar-actions">
          <span className={`status ${health?.status === 'ok' ? 'online' : ''}`}><span className="status-dot" /> {health?.status === 'ok' ? 'Systems clear' : 'Checking systems'}</span>
          <button className="button button-dark" onClick={triggerSync} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync sources'}</button>
        </div>
      </header>

      <section className="hero hero-compact">
        <div><p className="eyebrow">The reading room</p><h1>Browse better.<br /><em>Read deeper.</em></h1><p className="hero-copy">Your curated articles, distilled into one calm place to discover and read.</p></div>
        <div className="hero-note"><span>✦</span><p>{total || articles.length} stories<br /><strong>in your queue.</strong></p></div>
      </section>

      <section className="toolbar">
        <div className="filters" aria-label="Filter articles by category">{categories.map((item) => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, source, tag" /></label>
      </section>

      {error ? <div className="notice">{error} <button onClick={() => void loadArticles()}>Try again</button></div> : null}
      {loading ? <div className="empty-state"><span className="loader" /> Curating your queue…</div> : null}
      {!loading && !error && visibleArticles.length === 0 ? <div className="empty-state"><div className="empty-icon">✦</div><h3>Your queue is quiet.</h3><p>Sync your sources to bring in the next good read.</p></div> : null}

      {!loading && visibleArticles.length > 0 ? <section className="browser-layout">
        <aside className="article-list" aria-label="Article list">
          <div className="list-heading"><div><p className="eyebrow">Your queue</p><h2>{visibleArticles.length} articles</h2></div><span>Newest first</span></div>
          <div className="list-scroll">{visibleArticles.map((article) => <button className={`article-row ${selectedArticle?.id === article.id ? 'selected' : ''}`} key={article.id} onClick={() => setSelectedId(article.id)}><span className="row-category">{article.source.category ?? 'article'}</span><strong>{article.title}</strong><span className="row-meta">{article.source.name} · {formatDate(article.publishedAt)}</span></button>)}</div>
        </aside>

        <article className="reader-panel">
          {selectedArticle ? <>
            <div className="reader-topline"><span className="category-label">{selectedArticle.source.category ?? 'Featured'}</span><span>{formatDate(selectedArticle.publishedAt)} · {selectedArticle.readingTimeMinutes ?? 5} min read</span></div>
            <h2>{selectedArticle.title}</h2>
            <div className="reader-source"><span className="source-avatar">{selectedArticle.source.name.slice(0, 1)}</span><span><strong>{selectedArticle.source.name}</strong><small>{selectedArticle.author ? `By ${selectedArticle.author}` : 'Curated source'}</small></span></div>
            <div className="reader-actions"><a className="button button-dark" href={selectedArticle.originalUrl} target="_blank" rel="noreferrer">Open original ↗</a>{selectedArticle.source.siteUrl ? <a className="quiet-link" href={selectedArticle.source.siteUrl} target="_blank" rel="noreferrer">Visit source</a> : null}</div>
            <div className="summary-box"><p className="eyebrow">In brief</p><p>{selectedArticle.summaryShort ?? 'This article has not been summarized yet.'}</p></div>
            {selectedBullets.length > 0 ? <div className="takeaways"><p className="eyebrow">Key takeaways</p><ul>{selectedBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div> : null}
            {readerLoading ? <div className="reader-loading"><span className="loader" /> Loading full article…</div> : null}
            {readerError ? <div className="reader-notice">{readerError}</div> : null}
            {selectedParagraphs.length > 0 ? <div className="article-text"><p className="eyebrow">Article text</p>{selectedParagraphs.slice(0, 8).map((paragraph, index) => <p key={`${selectedArticle.id}-${index}`}>{paragraph}</p>)}{selectedParagraphs.length > 8 ? <a className="quiet-link" href={selectedArticle.originalUrl} target="_blank" rel="noreferrer">Continue reading original ↗</a> : null}</div> : null}
            {listValue(selectedArticle.tags).length > 0 ? <div className="tag-list">{listValue(selectedArticle.tags).map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
          </> : null}
        </article>
      </section> : null}

      <footer><span>Scroll Zero</span><span>Less feed. More signal.</span></footer>
    </main>
  );
}
