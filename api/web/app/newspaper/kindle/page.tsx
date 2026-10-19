import { headers } from 'next/headers';

type Article = {
  id: string;
  title: string;
  originalUrl: string;
  leadImageUrl?: string | null;
  summaryShort?: string | null;
  publishedAt?: string | null;
  readingTimeMinutes?: number | null;
  viewCount?: number;
  source: { name: string; category?: string | null };
};
type ArticleResponse = { items: Article[]; pagination: { total: number } };

function formatDate(value?: string | null) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function loadArticles(page: number) {
  await headers();
  const apiOrigin = `http://127.0.0.1:${process.env.PORT ?? '3001'}`;
  const response = await fetch(`${apiOrigin}/api/articles?page=${page}&limit=20`, { cache: 'no-store' });
  if (!response.ok) return { items: [], pagination: { total: 0 } } as ArticleResponse;
  return (await response.json()) as ArticleResponse;
}

export default async function KindleNewspaperPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const data = await loadArticles(page);
  const maxViews = Math.max(0, ...data.items.map((article) => article.viewCount ?? 0));
  const nextPage = page * 20 < data.pagination.total ? page + 1 : null;

  return <main className="newspaper-app kindle-newspaper">
    <section className="newspaper-sheet">
      <div className="newspaper-masthead"><span>Kindle edition</span><strong>SCROLL ZERO</strong><span>Tap a headline to read</span></div>
      <div className="newspaper-rule" />
      <div className="kindle-story-list">{data.items.map((article) => {
        const ratio = maxViews > 0 ? (article.viewCount ?? 0) / maxViews : 0;
        const sizeClass = ratio >= .65 ? 'size-large' : ratio >= .25 ? 'size-medium' : 'size-small';
        return <article className={`newspaper-story ${sizeClass}`} key={article.id}>
          <div className="newspaper-story-kicker">{article.source.category ?? 'Dispatch'} · {article.source.name}</div>
          <h2><a href={`/?article=${encodeURIComponent(article.id)}`}>{article.title}</a></h2>
          {article.leadImageUrl ? <img src={article.leadImageUrl} alt="" /> : null}
          <p>{article.summaryShort ?? 'A concise report from the Scroll Zero reading desk.'}</p>
          <div className="newspaper-story-footer"><span>{formatDate(article.publishedAt)}</span><span>{article.readingTimeMinutes ?? 5} min read</span></div>
        </article>;
      })}</div>
      {nextPage ? <p className="kindle-next"><a href={`/newspaper?page=${nextPage}`}>Load more stories →</a></p> : <p className="kindle-next">End of the edition</p>}
    </section>
  </main>;
}
