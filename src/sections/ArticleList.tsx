import { Link } from 'react-router-dom';
import { ARTICLES, formatDate, type Article } from '../lib/articles';

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link to={`/blog/${a.slug}`} className="post-card">
      <div className="post-meta">
        <span className="post-cat">{a.category}</span>
        <span className="post-date">{formatDate(a.date)}</span>
      </div>
      <h3 className="post-title">{a.title}</h3>
      {a.excerpt && <p className="post-excerpt">{a.excerpt}</p>}
      <span className="post-more">READ →</span>
    </Link>
  );
}

export function ArticleList({ limit }: { limit?: number }) {
  const list = limit ? ARTICLES.slice(0, limit) : ARTICLES;

  return (
    <section id="articles" className="section">
      <div className="section-head">
        <span className="section-index">02</span>
        <h2>
          JOURNAL<span className="jp-sub">からだの読みもの</span>
        </h2>
        <p className="section-lead">
          痛みや不調のしくみを、解剖学と神経科学の視点からやさしく解説しています。
        </p>
      </div>

      {list.length > 0 ? (
        <div className="post-grid">
          {list.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      ) : (
        <p className="region-articles-empty">記事は準備中です。</p>
      )}

      {limit && ARTICLES.length > limit && (
        <div className="list-more">
          <Link to="/blog" className="cta-ghost">
            すべての記事を見る（{ARTICLES.length}件）
          </Link>
        </div>
      )}
    </section>
  );
}
