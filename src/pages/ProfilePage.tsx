import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';

/**
 * 自己紹介ページ
 * 内容はブログ本体の自己紹介（seitai-site/src/app/about/page.tsx）にそろえている。
 * 経歴・資格を変えたときは、両方を直す。
 */
const CLINICAL = [
  { year: '2015', title: '理学療法士免許を取得', detail: '' },
  { year: '2015〜', title: '整形外科クリニックに勤務', detail: '保存療法を中心とした外来リハビリテーションに従事。' },
  {
    year: '2017〜',
    title: '日本鋼管病院 リハビリテーション科に勤務',
    detail: '急性期総合病院で、スポーツ整形外科を中心に、整形外科疾患・スポーツ外傷・障害・神経難病などのリハビリテーションに従事。一般の方からスポーツ愛好家、プロアスリートまで幅広く担当。',
  },
  { year: '2024', title: '東京都立大学大学院 修士課程修了', detail: '人間健康科学研究科（理学療法学）。' },
];

const TRAINER = [
  { year: '2015〜2018', title: '大学サッカー部 トレーナー', detail: '' },
  { year: '2018〜2024', title: 'U-18 クラブチーム（サッカー）トレーナー', detail: '' },
  { year: '2024〜', title: 'パーソナルトレーナーとして活動を開始', detail: '' },
  { year: '現在', title: '病院勤務と並行して活動', detail: 'オンラインでの姿勢・運動指導、note・SNS・このサイトでの情報発信を行っています。' },
];

const QUALIFICATIONS = [
  { group: '国家資格', items: ['理学療法士'] },
  { group: '学位', items: ['修士（理学療法学）'] },
  { group: 'トレーニング・その他', items: ['ピラティスインストラクター'] },
];

const TRAINING = [
  {
    field: '筋膜・徒手療法',
    items: ['国際筋膜マニピュレーション（Fascial Manipulation®）レベル1〜4 修了', '組織間リリース（スペイン）講習 受講'],
  },
  {
    field: '姿勢・運動発達',
    items: ['DNS（Dynamic Neuromuscular Stabilization）Aコース・Bコース・Cコース・小児コース 修了', 'PRI（Postural Restoration Institute）基礎コース 修了'],
  },
  { field: '機能神経学', items: ['Z-Health 基礎コース 修了'] },
  { field: '栄養', items: ['分子栄養学 基礎コース 修了'] },
];

const PRESENTATIONS = [
  { group: '国内', items: ['日本理学療法学術大会', '日本関節鏡・膝・スポーツ整形外科学会（JOSKAS）', '日本膝関節学会', '日本スポーツ理学療法学会'] },
  { group: '国際', items: ['1st Asian Physiotherapy Network Conference'] },
];

const EXPERTISE = ['筋膜', '姿勢・運動発達', '機能神経学', '分子栄養学', '運動指導・ピラティス'];

function CareerList({ items }: { items: { year: string; title: string; detail: string }[] }) {
  return (
    <div className="career-list">
      {items.map((item) => (
        <article key={`${item.year}-${item.title}`}>
          <time>{item.year}</time>
          <div>
            <h3>{item.title}</h3>
            {item.detail && <p>{item.detail}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProfilePage() {
  return (
    <div className="profile-page page-top-pad">
      <header className="profile-page-hero">
        <div className="profile-page-portrait has-photo">
          <img src="/images/profile/profile_4x5.jpg" alt="理学療法士 富田 樹" width={720} height={900} />
        </div>
        <div className="profile-page-copy">
          <p className="section-index">PROFILE / ABOUT ME</p>
          <h1>富田 樹<small>Etsuki Tomita</small></h1>
          <p className="profile-page-role"><span>理学療法士（理学療法学修士）</span><span>パーソナルトレーナー</span><span>ピラティスインストラクター</span></p>
          <p className="profile-page-intro">
            整形外科クリニックと、スポーツ整形外科に力を入れる急性期総合病院で、10年以上リハビリテーションに携わってきました。病院の外では、大学サッカー部とU-18のクラブチームでトレーナーを務め、2024年からはパーソナルトレーナーとしても活動しています。
          </p>
          <div className="profile-page-actions">
            <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="cta-primary">健康記事を読む ↗</a>
            <Link to="/lab" className="cta-ghost">体験ラボを見る</Link>
          </div>
        </div>
      </header>

      <section className="profile-block profile-message">
        <div className="profile-block-label"><span>01</span><b>MESSAGE</b></div>
        <div>
          <h2>このサイトについて</h2>
          <p>臨床の中で強く感じてきたのは、痛みや不調の原因は、症状が出ている場所だけにあるとは限らない、ということです。姿勢のくせ、筋膜のつながり、動きの発達、神経の働き、そして毎日の食事。身体はそれらが重なり合って、いまの状態をつくっています。</p>
          <p>ただ、こうした体のしくみは、文章で読むだけではなかなか実感しにくいものです。このサイトでは、目を閉じて角度を合わせる、スマホでふらつきを測る、3Dで腹圧や筋膜の動きを見る、といった体験を通して、自分の体で確かめながら理解できるようにしています。</p>
        </div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>02</span><b>EXPERTISE</b></div>
        <div><h2>専門分野</h2><div className="profile-tags">{EXPERTISE.map((item) => <span key={item}>{item}</span>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>03</span><b>CAREER</b></div>
        <div>
          <h2>経歴</h2>
          <h3 className="career-sub">臨床・学術</h3>
          <CareerList items={CLINICAL} />
          <h3 className="career-sub">トレーナー活動</h3>
          <CareerList items={TRAINER} />
        </div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>04</span><b>LICENSE</b></div>
        <div><h2>保有資格・学位</h2><div className="qualification-grid">{QUALIFICATIONS.map((group) => <article key={group.group}><p>{group.group}</p><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>05</span><b>EDUCATION</b></div>
        <div><h2>研修・講習の受講歴</h2><div className="training-list">{TRAINING.map((group) => <details key={group.field}><summary>{group.field}<span>＋</span></summary><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></details>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>06</span><b>PRESENTATIONS</b></div>
        <div><h2>学会発表</h2><div className="qualification-grid profile-presentations">{PRESENTATIONS.map((group) => <article key={group.group}><p>{group.group}</p><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>07</span><b>POLICY</b></div>
        <div><h2>情報発信の方針</h2><div className="policy-grid"><p><b>01</b>可能な限り一次論文・公式資料を確認します。</p><p><b>02</b>確立した知見と仮説を区別して記載します。</p><p><b>03</b>体験コンテンツを医学的診断の代わりには使用しません。</p><p><b>04</b>内容に誤りが見つかった場合は確認・修正します。</p></div></div>
      </section>

      <section className="profile-contact">
        <p className="section-index">CONTACT</p><h2>取材・執筆・共同企画など</h2><p>お問い合わせはブログ本体のCONTACTページから受け付けています。</p><a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">お問い合わせページへ ↗</a>
      </section>
    </div>
  );
}
