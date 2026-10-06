import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';

const FEATURES = [
  ['01', 'ご希望を確認', '目的や気になっていることを事前にうかがいます。'],
  ['02', 'からだを評価', '動きやすさや身体の特徴を一緒に確認します。'],
  ['03', '個別にサポート', 'その日の状態と目的に合わせて運動を組み立てます。'],
];

export function PersonalTrainingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="personal-page page-top-pad">
      <header className="personal-page-hero">
        <span className="section-index">VISITING PERSONAL TRAINING</span>
        <h1>あなたの場所で、<br /><em>からだと向き合う。</em></h1>
        <p>
          理学療法士の視点を活かし、一人ひとりに合わせて行う出張パーソナルトレーニング。
          正式なサービス内容は現在準備中です。
        </p>
        <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">
          ご相談・お問い合わせ ↗
        </a>
      </header>

      <section className="personal-page-section">
        <div className="personal-page-heading">
          <span className="section-index">ABOUT</span>
          <h2>一人ひとりの身体に、<br />合わせる時間。</h2>
        </div>
        <div className="personal-feature-list">
          {FEATURES.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="personal-coming-soon">
        <span className="section-index">DETAILS / COMING SOON</span>
        <h2>ご案内内容は順次追加します。</h2>
        <p>対応地域、料金、所要時間、ご利用の流れなどを掲載予定です。</p>
        <div className="personal-page-actions">
          <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">先に相談する ↗</a>
          <Link to="/profile" className="cta-ghost">プロフィールを見る →</Link>
        </div>
      </section>
    </div>
  );
}
