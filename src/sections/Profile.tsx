import { BLOG_BASE } from '../data/blogLinks';

/**
 * トップページのヒーロー
 * 文言を書き換えるだけで内容を更新できます。
 */
export function Profile() {
  return (
    <header className="hero profile-hero lab-home-hero">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-inner">
        <p className="hero-kicker">INTERACTIVE BODY SCIENCE</p>
        <h1>
          からだは、
          <br />
          <em>触れる科学。</em>
        </h1>
        <p className="hero-lead">
          骨格・筋膜・腹圧・神経・栄養。読むだけでは見えにくい身体のしくみを、自分の手で動かしながら理解するための体験型ラボです。
        </p>

        <div className="profile-meta">
          <div className="profile-meta-item">
            <span>BY</span>
            <b>富田 樹 / Etsuki Tomita</b>
          </div>
          <div className="profile-meta-item">
            <span>FIELD</span>
            <b>理学療法士 / 理学療法学修士</b>
          </div>
        </div>

        <div className="hero-cta">
          <a href="#bodymap" className="cta-primary">
            BODY MAPを体験 ↓
          </a>
          <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="cta-ghost">
            健康記事を読む ↗
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
