import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getArticle, ARTICLES, formatDate } from '../lib/articles';
import { REGIONS } from '../data/regions';

export function ArticlePage() {
  const { slug } = useParams();
  const article = getArticle(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (article) document.title = `${article.title} — からだの保健室`;
    return () => {
      document.title = 'からだの保健室 — tomy';
    };
  }, [article]);

  if (!article) {
    return (
      <section className="section article-missing">
        <h2>記事が見つかりませんでした</h2>
        <p className="section-lead">URLが変更されたか、記事が削除された可能性があります。</p>
        <Link to="/" className="cta-primary">
          トップへ戻る
        </Link>
      </section>
    );
  }

  const parts = article.parts
    .map((p) => REGIONS.find((r) => r.id === p))
    .filter((r): r is (typeof REGIONS)[number] => Boolean(r));

  const others = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <article className="section article-page">
      <Link to="/" className="back-link">
        ← 記事一覧へ
      </Link>

      <header className="article-head">
        <div className="post-meta">
          <span className="post-cat">{article.category}</span>
          <span className="post-date">{formatDate(article.date)}</span>
        </div>
        <h1>{article.title}</h1>
        {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
        {parts.length > 0 && (
          <div className="article-parts">
            {parts.map((p) => (
              <span key={p.id} className="chip chip-static">
                {p.label}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="article-body" dangerouslySetInnerHTML={{ __html: article.html }} />

      {article.source && (
        <p className="article-source">
          初出:{' '}
          <a href={article.source} target="_blank" rel="noreferrer">
            note
          </a>
        </p>
      )}

      {others.length > 0 && (
        <aside className="article-more">
          <div className="region-articles-title">ほかの記事</div>
          {others.map((a) => (
            <Link key={a.slug} to={`/blog/${a.slug}`} className="article-link">
              <span className="article-label">
                {a.category} ・ {formatDate(a.date)}
              </span>
              <span className="article-title">{a.title} →</span>
            </Link>
          ))}
        </aside>
      )}
    </article>
  );
}
