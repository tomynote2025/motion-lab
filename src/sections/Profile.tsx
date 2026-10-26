import { Link } from 'react-router-dom';
import { BLOG_BASE } from '../data/blogLinks';
import { getLab } from '../data/labs';

const HERO_LABS = ['homunculus', 'fascia-network', 'proprioception'].map(getLab);

/**
 * トップページのヒーロー
 * 文言を書き換えるだけで内容を更新できます。
 */
export function Profile() {
  return (
    <header className="hero profile-hero lab-home-hero">
      <div className="hero-inner">
        <p className="hero-kicker">INTERACTIVE BODY SCIENCE</p>
        <h1>
          からだは、
          <br />
          <em>触れる科学。</em>
        </h1>
        <p className="hero-lead">
          体の感覚を、自分で試して確かめる。3Dの骨格マップと、関節の位置感覚・ふらつき・腹圧・呼吸・痛みなど11の体験ラボで、読むだけでは見えにくい体のしくみを、自分の手で動かしながら理解できます。
        </p>

        <div className="hero-cta">
          <Link to="/lab" className="cta-primary">
            体験ラボを選ぶ →
          </Link>
          <a href="#bodymap" className="cta-ghost">
            3D骨格マップ ↓
          </a>
          <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="cta-ghost">
            健康記事を読む ↗
          </a>
        </div>

        <div className="profile-meta">
          <div className="profile-meta-item">
            <span>BY</span>
            <b>富田 樹 / Etsuki Tomita</b>
          </div>
          <div className="profile-meta-item">
            <span>FIELD</span>
            <b>理学療法士（理学療法学修士）</b>
          </div>
          <div className="profile-meta-item">
            <span>ACTIVITY</span>
            <b>パーソナルトレーナー / ピラティスインストラクター</b>
          </div>
        </div>
      </div>
      {/* 最初の画面で「何ができるか」が分かるよう、実際のラボの画面を並べる（パソコン幅のみ） */}
      <div className="hero-labs" aria-label="体験ラボの例">
        {HERO_LABS.map((l, i) => (
          <Link key={l.id} to={`/lab/${l.id}`} className={`hero-lab hero-lab-${i + 1}`}>
            <img src={`/images/hero/${l.id}.webp`} alt="" loading="eager" />
            <span>
              <b>{l.title}</b>
              {l.hook}
            </span>
          </Link>
        ))}
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
