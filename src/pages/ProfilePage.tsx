import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';

/**
 * 自己紹介ページ
 * 内容を追加するときは、下の各配列に項目を追記してください。
 */
const CAREER = [
  { year: '20XX', title: '経歴を入力', detail: '勤務先・担当領域・活動内容などを入力してください。' },
  { year: '20XX', title: '経歴を入力', detail: '大学院・研究活動・現在の活動などを入力してください。' },
];

const QUALIFICATIONS = [
  { group: '国家資格', items: ['理学療法士'] },
  { group: '学位', items: ['修士（理学療法学）'] },
  { group: 'トレーニング・その他', items: ['資格名を入力'] },
];

const TRAINING = [
  { field: '筋膜・徒手療法', items: ['講習会・コース名を入力'] },
  { field: '機能神経学', items: ['講習会・コース名を入力'] },
  { field: '呼吸・体幹機能', items: ['講習会・コース名を入力'] },
  { field: 'トレーニング・栄養', items: ['講習会・コース名を入力'] },
];

const EXPERTISE = ['運動器理学療法', '姿勢・動作分析', '呼吸・体幹機能', '筋膜', '機能神経学', 'トレーニング', '栄養学'];

export function ProfilePage() {
  return (
    <div className="profile-page page-top-pad">
      <header className="profile-page-hero">
        <div className="profile-page-portrait" aria-label="プロフィール写真の予定位置">
          <span>ET</span>
          <small>PHOTO<br />COMING SOON</small>
        </div>
        <div className="profile-page-copy">
          <p className="section-index">PROFILE / ABOUT ME</p>
          <h1>富田 樹<small>Etsuki Tomita</small></h1>
          <p className="profile-page-role"><span>理学療法士（理学療法学修士）</span><span>パーソナルトレーナー</span><span>ピラティスインストラクター</span></p>
          <p className="profile-page-intro">身体のしくみを、専門用語だけで終わらせず、一般の方にも触れて理解できる形で届けることを目指しています。詳しい自己紹介文は後から追加できます。</p>
          <div className="profile-page-actions">
            <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="cta-primary">健康記事を読む ↗</a>
            <Link to="/lab" className="cta-ghost">体験Labを見る</Link>
          </div>
        </div>
      </header>

      <section className="profile-block profile-message">
        <div className="profile-block-label"><span>01</span><b>MESSAGE</b></div>
        <div><h2>このサイトを作った理由</h2><p>ここに、情報発信を始めた理由、読者へ届けたいこと、将来の開院に向けた思いなどを入力します。</p><p className="profile-edit-note">EDIT GUIDE：この文章は <code>src/pages/ProfilePage.tsx</code> で変更できます。</p></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>02</span><b>EXPERTISE</b></div>
        <div><h2>専門・関心領域</h2><div className="profile-tags">{EXPERTISE.map((item) => <span key={item}>{item}</span>)}</div><p className="profile-caption">正式な専門領域と学習中の領域は、内容追加時に分けて表示できます。</p></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>03</span><b>CAREER</b></div>
        <div><h2>経歴</h2><div className="career-list">{CAREER.map((item, index) => <article key={`${item.year}-${index}`}><time>{item.year}</time><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>04</span><b>LICENSE</b></div>
        <div><h2>保有資格・学位</h2><div className="qualification-grid">{QUALIFICATIONS.map((group) => <article key={group.group}><p>{group.group}</p><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>05</span><b>EDUCATION</b></div>
        <div><h2>受講歴・研修歴</h2><div className="training-list">{TRAINING.map((group) => <details key={group.field}><summary>{group.field}<span>＋</span></summary><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></details>)}</div><p className="profile-caption">受講歴・修了歴・認定資格を区別して掲載する予定です。</p></div>
      </section>

      <section className="profile-block">
        <div className="profile-block-label"><span>06</span><b>POLICY</b></div>
        <div><h2>情報発信の方針</h2><div className="policy-grid"><p><b>01</b>可能な限り一次論文・公式資料を確認します。</p><p><b>02</b>確立した知見と仮説を区別して記載します。</p><p><b>03</b>体験コンテンツを医学的診断の代わりには使用しません。</p><p><b>04</b>内容に誤りが見つかった場合は確認・修正します。</p></div></div>
      </section>

      <section className="profile-contact">
        <p className="section-index">CONTACT</p><h2>取材・執筆・共同企画など</h2><p>お問い合わせはブログ本体のCONTACTページから受け付けています。</p><a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer" className="cta-primary">お問い合わせページへ ↗</a>
      </section>
    </div>
  );
}
