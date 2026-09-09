import { BLOG_BASE } from '../data/blogLinks';

/**
 * トップページのヒーロー
 * 文言を書き換えるだけで内容を更新できます。
 */
export function Profile() {
  return (
    <header className="hero profile-hero">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-inner">
        <p className="hero-kicker">からだの実験室</p>
        <h1>
          からだのしくみを、
          <br />
          <em>さわって</em>確かめる。
        </h1>
        <p className="hero-lead">
          読むだけでは掴みにくい「腹圧」「筋膜の滑り」「眼と平衡感覚」を、実際に動かしながら理解できる体験サイトです。3D骨格モデルから、気になる部位の記事にも辿れます。
        </p>

        <div className="profile-meta">
          <div className="profile-meta-item">
            <span>BY</span>
            <b>tomy / 冨田 悦樹</b>
          </div>
          <div className="profile-meta-item">
            <span>FIELD</span>
            <b>姿勢・腰痛・体幹・機能神経学・栄養</b>
          </div>
        </div>

        <div className="hero-cta">
          <a href="#bodymap" className="cta-primary">
            3D骨格から探す ↓
          </a>
          <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="cta-ghost">
            ブログを読む ↗
          </a>
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-inner">
          {'MOVE — BREATHE — BALANCE — SENSE — STABILIZE — '.repeat(4)}
          {'MOVE — BREATHE — BALANCE — SENSE — STABILIZE — '.repeat(4)}
        </div>
      </div>
    </header>
  );
}
