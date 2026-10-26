import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';
import { FirstTrialOffer } from '../components/FirstTrialOffer';

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

const RECOMMENDED = [
  '痛みや不安があるけれど、無理なく運動を始めたい',
  '痛みを繰り返しにくい身体づくりを目指したい',
  'リハビリ終了後も、自分に合った運動を継続したい',
  '姿勢や身体の使い方を知り、動きの質を高めたい',
];

const GUIDE_LINKS = [
  ['/personal-training/first', 'FIRST VISIT', '初めての方へ', '準備するものや、ご自宅で受ける際のポイントをご案内します。'],
  ['/personal-training/body-care', 'BODY CARE', '整体・身体調整', '手技を中心に、身体を評価して動きやすさを整えるサービスです。'],
  ['#price', 'PRICE', '料金', 'コース料金と料金に含まれる内容を確認できます。'],
  ['#flow', 'FLOW', 'ご利用の流れ', '申し込みから当日までの手順を確認できます。'],
  ['/profile', 'TRAINER', '担当者紹介', '経歴・資格・大切にしている考えをご紹介します。'],
  ['/personal-training/voices', 'STORIES', 'お客様の声', '掲載準備中のページです。'],
  ['/personal-training/areas', 'AREA', '対応エリア', 'ご自宅、レンタルジム、北品川の違いをご案内します。'],
  ['/personal-training/faq', 'FAQ', 'よくある質問', '服装、女性お一人でのご依頼、支払いなどをまとめています。'],
] as const;

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
          からだのしくみをふまえ、目的と身体の状態に合わせて行う
          完全予約制のパーソナルトレーニングです。
        </p>
        <Link to="/personal-training/apply" className="cta-primary">申し込みフォームへ →</Link>
      </header>

      <FirstTrialOffer />

      <section className="personal-guide-section">
        <div className="personal-section-heading">
          <span className="section-index">INFORMATION</span>
          <h2>ご利用案内</h2>
        </div>
        <div className="personal-guide-grid">
          {GUIDE_LINKS.map(([href, label, title, description]) => {
            const content = <><span>{label}</span><h3>{title}</h3><p>{description}</p><b>詳しく見る →</b></>;
            return href.startsWith('#')
              ? <a href={href} key={href}>{content}</a>
              : <Link to={href} key={href}>{content}</Link>;
          })}
        </div>
      </section>

      <section className="personal-info-section">
        <div className="personal-section-heading">
          <span className="section-index">AREA / LOCATION</span>
          <h2>対応エリア</h2>
        </div>
        <div className="personal-area-grid">
          <article>
            <span>STANDARD AREA</span>
            <h3>目黒区・渋谷区・港区<br /><small>中目黒・恵比寿・代官山・六本木周辺</small></h3>
            <p>ご自宅への訪問、または周辺のレンタルジムで実施します。</p>
          </article>
          <article>
            <span>PERSONAL GYM</span>
            <h3>品川エリア<br /><small>北品川駅 徒歩3分</small></h3>
            <p>北品川のパーソナルジムで実施します。詳細な場所は日程調整時にご案内します。</p>
          </article>
        </div>
      </section>

      <section className="personal-price-section" id="price">
        <div className="personal-section-heading">
          <span className="section-index">PRICE</span>
          <h2>料金</h2>
        </div>
        <div className="personal-price-label">
          <span>VISITING PLAN</span>
          <p>ご自宅 / レンタルジム｜目黒区・渋谷区・港区の指定エリア</p>
        </div>
        <div className="personal-price-grid">
          <article><span>STANDARD</span><b>60<small> min</small></b><strong>¥12,000</strong></article>
          <article><span>EXTENDED</span><b>90<small> min</small></b><strong>¥16,500</strong></article>
        </div>
        <p className="personal-price-note">表示価格は出張費込みです。レンタルジムを利用する場合は、ジム利用料も含みます。ご自宅での実施も同一料金です。</p>
        <div className="personal-gym-price">
          <div>
            <span>SHINAGAWA PERSONAL GYM</span>
            <h3>北品川ジムプラン</h3>
            <p>北品川駅から徒歩3分のパーソナルジムで実施します。</p>
          </div>
          <div className="personal-gym-price-value">
            <strong>別料金</strong>
            <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer">料金を問い合わせる ↗</a>
          </div>
        </div>
      </section>

      <section className="personal-recommended-section">
        <div className="personal-section-heading">
          <span className="section-index">RECOMMENDED FOR</span>
          <h2>こんな方におすすめ</h2>
        </div>
        <div className="personal-recommended-list">
          {RECOMMENDED.map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
        <small>医師から運動制限を受けている方は、事前に主治医へご相談ください。</small>
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

      <section className="personal-flow-section" id="flow">
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
          <Link to="/personal-training/apply" className="cta-primary">申し込みフォームへ →</Link>
          <Link to="/profile" className="cta-ghost">プロフィールを見る →</Link>
        </div>
        <small>本サービスは医学的な診断・治療の代わりとなるものではありません。強い痛みやしびれ等がある場合は、事前に医療機関へご相談ください。</small>
      </section>
    </div>
  );
}
