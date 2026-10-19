'use client';

import { useEffect, useMemo, useState } from 'react';

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

const PAGE_SIZE = 6;

function formatDate(value?: string | null) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function NewspaperPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const requestedPage = Number(new URLSearchParams(window.location.search).get('page'));
    if (Number.isFinite(requestedPage) && requestedPage > 0) setPage(Math.floor(requestedPage));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch('/api/articles?page=1&limit=30', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('The newspaper could not be printed.');
        return (await response.json()) as ArticleResponse;
      })
      .then((data) => {
        setArticles(data.items ?? []);
        setTotal(data.pagination?.total ?? data.items?.length ?? 0);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the newspaper.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageArticles = useMemo(() => articles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [articles, currentPage]);
  const lead = pageArticles[0];
  const sideStories = pageArticles.slice(1, 3);
  const lowerStories = pageArticles.slice(3);

  function goToPage(nextPage: number) {
    const boundedPage = Math.max(1, Math.min(pageCount, nextPage));
    setPage(boundedPage);
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(boundedPage));
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goToPage(currentPage + 1);
      if (event.key === 'ArrowLeft') goToPage(currentPage - 1);
      if (event.key === '+' || event.key === '=') setZoom((value) => Math.min(1.35, Number((value + 0.1).toFixed(2))));
      if (event.key === '-') setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, pageCount]);

  function story(article: Article, className = '') {
    return <article className={`newspaper-story ${className}`} key={article.id}>
      <div className="newspaper-story-kicker">{article.source.category ?? 'Dispatch'} · {article.source.name}</div>
      <h2><a href={`/?article=${encodeURIComponent(article.id)}`}>{article.title}</a></h2>
      {article.leadImageUrl ? <img src={article.leadImageUrl} alt="" loading="lazy" /> : null}
      <p>{article.summaryShort ?? 'A concise report from the Scroll Zero reading desk.'}</p>
      <div className="newspaper-story-footer"><span>{formatDate(article.publishedAt)}</span><span>{article.readingTimeMinutes ?? 5} min read</span></div>
    </article>;
  }

  return <main className="newspaper-app">
    <header className="newspaper-topbar">
      <a className="brand" href="/"><span className="brand-mark">S0</span><span>scroll0</span></a>
      <a className="newspaper-back" href="/">Back to reading desk</a>
    </header>

    <nav className="newspaper-controls" aria-label="Newspaper controls">
      <div className="page-controls"><button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Previous</button><span>Page {currentPage} of {pageCount}</span><button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>Next →</button></div>
      <div className="zoom-controls"><span>View</span><button onClick={() => setZoom((value) => Math.max(.7, Number((value - .1).toFixed(2))))} aria-label="Zoom out">−</button><strong>{Math.round(zoom * 100)}%</strong><button onClick={() => setZoom((value) => Math.min(1.35, Number((value + .1).toFixed(2))))} aria-label="Zoom in">+</button><button onClick={() => setZoom(1)}>Reset</button></div>
    </nav>

    {loading ? <div className="newspaper-empty">Printing today’s edition…</div> : null}
    {error ? <div className="newspaper-empty">{error}</div> : null}
    {!loading && !error && pageArticles.length === 0 ? <div className="newspaper-empty">No stories are ready for this edition.</div> : null}

    {!loading && !error && lead ? <div className="newspaper-stage"><section className="newspaper-sheet" style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
      <div className="newspaper-masthead"><span>Vol. 01 · No. {currentPage}</span><strong>SCROLL ZERO</strong><span>Less feed. More signal.</span></div>
      <div className="newspaper-rule" />
      <div className="newspaper-grid">
        <div className="newspaper-lead">{story(lead, 'lead-story')}</div>
        <div className="newspaper-side">{sideStories.map((article) => story(article))}</div>
      </div>
      {lowerStories.length > 0 ? <div className="newspaper-lower">{lowerStories.map((article) => story(article, 'compact-story'))}</div> : null}
      <footer className="newspaper-footer"><span>scroll0.com/newspaper</span><span>Page {currentPage} · Printed for the curious</span></footer>
    </section></div> : null}
  </main>;
}
