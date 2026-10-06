import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';

const SERVICES = [
  ['01', '姿勢・動作チェック', '立ち方、歩き方、身体の使い方を確認し、現在の特徴を一緒に整理します。'],
  ['02', '筋膜コンディショニング', '身体の状態に合わせ、筋膜の滑走と動きやすさを意識した調整を行います。'],
  ['03', 'アスリートパフォーマンス', '競技特性と目標に合わせ、動作の質、パワー、安定性の向上を目指します。'],
  ['04', '慢性的な不調への運動サポート', '慢性的な痛みや動きにくさに配慮しながら、無理のない運動を組み立てます。'],
];

const FLOW = [
  ['01', '申し込みフォーム', '希望エリア、希望日時、目的などをご記入ください。'],
  ['02', '日程・場所の調整', '内容を確認し、実施日時と利用するジムをご案内します。'],
  ['03', '問診票を入力', '日程確定後にお送りする問診票へ、身体の状態や既往歴などをご入力ください。'],
  ['04', 'セッション当日', '内容を確認したうえで、評価とトレーニングを行います。'],
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
          理学療法士の視点を活かし、目的と身体の状態に合わせて行う
          完全予約制のパーソナルトレーニングです。
        </p>
        <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">
          申し込みフォームへ ↗
        </a>
      </header>

      <section className="personal-info-section">
        <div className="personal-section-heading">
          <span className="section-index">AREA / LOCATION</span>
          <h2>対応エリア</h2>
        </div>
        <div className="personal-area-grid">
          <article>
            <span>VISITING AREA</span>
            <h3>中目黒・恵比寿<br />六本木・代官山</h3>
            <p>ご希望のエリアにあるレンタルジム等を手配して実施します。</p>
          </article>
          <article>
            <span>PERSONAL GYM</span>
            <h3>品川エリア<br /><small>北品川駅 徒歩3分</small></h3>
            <p>北品川のパーソナルジムで実施します。詳細な場所は日程調整時にご案内します。</p>
          </article>
        </div>
      </section>

      <section className="personal-price-section">
        <div className="personal-section-heading">
          <span className="section-index">PRICE</span>
          <h2>料金</h2>
        </div>
        <div className="personal-price-grid">
          <article><span>STANDARD</span><b>60<small> min</small></b><strong>¥12,000</strong></article>
          <article><span>EXTENDED</span><b>90<small> min</small></b><strong>¥16,500</strong></article>
        </div>
        <p className="personal-price-note">表示価格は出張費込みです。レンタルジム利用料については、お申し込み時にご案内します。</p>
      </section>

      <section className="personal-page-section personal-services-section">
        <div className="personal-page-heading">
          <span className="section-index">SERVICE</span>
          <h2>身体を見て、<br />必要なことを選ぶ。</h2>
        </div>
        <div className="personal-feature-list">
          {SERVICES.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="personal-flow-section">
        <div className="personal-section-heading">
          <span className="section-index">HOW TO BOOK</span>
          <h2>ご利用の流れ</h2>
        </div>
        <div className="personal-flow-list">
          {FLOW.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="personal-coming-soon personal-booking-cta">
        <span className="section-index">BOOKING / CONTACT</span>
        <h2>まずはご希望を<br />お聞かせください。</h2>
        <p>希望エリアと日時を確認し、折り返しご連絡します。</p>
        <div className="personal-page-actions">
          <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">申し込みフォームへ ↗</a>
          <Link to="/profile" className="cta-ghost">プロフィールを見る →</Link>
        </div>
        <small>本サービスは医学的な診断・治療の代わりとなるものではありません。強い痛みやしびれ等がある場合は、事前に医療機関へご相談ください。</small>
      </section>
    </div>
  );
}
