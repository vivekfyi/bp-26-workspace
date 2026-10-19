'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Topic = { slug: string; name: string };
type Source = { name: string; category?: string | null; topics: Topic[] };
type Article = {
  id: string;
  title: string;
  originalUrl: string;
  leadImageUrl?: string | null;
  summaryShort?: string | null;
  summaryBullets?: unknown;
  publishedAt?: string | null;
  readingTimeMinutes?: number | null;
  source: Source;
};
type ArticleResponse = { items: Article[]; pagination: { total: number } };

const SECTION_SIZE = 6;
const API_PAGE_SIZE = 20;

function formatDate(value?: string | null) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function NewspaperPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [nextApiPage, setNextApiPage] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(`/api/articles?page=1&limit=${API_PAGE_SIZE}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('The newspaper could not be printed.');
        return (await response.json()) as ArticleResponse;
      })
      .then((data) => {
        setArticles(data.items ?? []);
        setTotal(data.pagination?.total ?? data.items?.length ?? 0);
        setHasMore((data.items?.length ?? 0) < (data.pagination?.total ?? 0));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the newspaper.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem('scroll0-read-articles') ?? '[]');
      if (Array.isArray(stored)) setReadIds(stored.filter((id): id is string => typeof id === 'string'));
    } catch {
      setReadIds([]);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/articles?page=${nextApiPage}&limit=${API_PAGE_SIZE}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('More stories could not be loaded.');
      const data = (await response.json()) as ArticleResponse;
      setArticles((current) => {
        const existing = new Set(current.map((article) => article.id));
        return [...current, ...(data.items ?? []).filter((article) => !existing.has(article.id))];
      });
      setTotal(data.pagination?.total ?? total);
      setNextApiPage((current) => current + 1);
      setHasMore((data.items?.length ?? 0) > 0 && (articles.length + (data.items?.length ?? 0)) < (data.pagination?.total ?? total));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'More stories could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }, [articles.length, hasMore, loadingMore, nextApiPage, total]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: '700px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const sections = useMemo(() => {
    const chunks: Article[][] = [];
    for (let index = 0; index < articles.length; index += SECTION_SIZE) chunks.push(articles.slice(index, index + SECTION_SIZE));
    return chunks;
  }, [articles]);

  function markRead(articleId: string) {
    setReadIds((current) => {
      if (current.includes(articleId)) return current;
      const next = [...current, articleId];
      window.localStorage.setItem('scroll0-read-articles', JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '+' || event.key === '=') setZoom((value) => Math.min(1.35, Number((value + 0.1).toFixed(2))));
      if (event.key === '-') setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function story(article: Article, className = '') {
    const isRead = readIds.includes(article.id);
    return <article className={`newspaper-story ${isRead ? 'is-read' : ''} ${className}`} key={article.id}>
      <div className="newspaper-story-kicker">{article.source.category ?? 'Dispatch'} · {article.source.name}</div>
      <h2><a href={`/?article=${encodeURIComponent(article.id)}`} onClick={() => markRead(article.id)}>{article.title}</a></h2>
      {article.leadImageUrl ? <img src={article.leadImageUrl} alt="" loading="lazy" /> : null}
      <p>{article.summaryShort ?? 'A concise report from the Scroll Zero reading desk.'}</p>
      <div className="newspaper-story-footer"><span>{formatDate(article.publishedAt)}</span><span>{article.readingTimeMinutes ?? 5} min read</span></div>
    </article>;
  }

  return <main className="newspaper-app">
    <nav className="newspaper-controls" aria-label="Newspaper controls">
      <div className="edition-status"><span>{total || articles.length} stories</span><span className="read-legend"><i /> Read stories are muted</span></div>
      <div className="zoom-controls"><span>View</span><button onClick={() => setZoom((value) => Math.max(.7, Number((value - .1).toFixed(2))))} aria-label="Zoom out">−</button><strong>{Math.round(zoom * 100)}%</strong><button onClick={() => setZoom((value) => Math.min(1.35, Number((value + .1).toFixed(2))))} aria-label="Zoom in">+</button><button onClick={() => setZoom(1)}>Reset</button></div>
    </nav>

    {loading ? <div className="newspaper-empty">Printing today’s edition…</div> : null}
    {error ? <div className="newspaper-empty">{error}</div> : null}
    {!loading && !error && sections.length === 0 ? <div className="newspaper-empty">No stories are ready for this edition.</div> : null}

    {!loading && !error && sections.length > 0 ? <div className="newspaper-stage"><section className="newspaper-sheet" style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
      {sections.map((section, sectionIndex) => {
        const lead = section[0];
        const sideStories = section.slice(1, 3);
        const lowerStories = section.slice(3);
        return <div className="newspaper-section" key={lead.id}>
          {sectionIndex === 0 ? <div className="newspaper-masthead"><span>Daily edition</span><strong>SCROLL ZERO</strong><span>Less feed. More signal.</span></div> : <div className="newspaper-continuation">Continued from the reading desk · Edition {sectionIndex + 1}</div>}
          <div className="newspaper-rule" />
          <div className="newspaper-grid">
            {story(lead, 'lead-story')}
            <div className="newspaper-flow">{[...sideStories, ...lowerStories].map((article) => story(article))}</div>
          </div>
        </div>;
      })}
      <footer className="newspaper-footer"><span>scroll0.com/newspaper</span><span>{readIds.length} stories read · Keep going</span></footer>
    </section></div> : null}
    <div ref={loadMoreRef} className="newspaper-load-more">{loadingMore ? 'Setting the next column…' : hasMore ? 'More stories ahead' : 'You’ve reached the end of the edition.'}</div>
  </main>;
}
