const MARQUEE = 'MOVE — BREATHE — BALANCE — SENSE — STABILIZE — ';

export function Hero() {
  return (
    <header className="hero">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-inner">
        <p className="hero-kicker">INTERACTIVE BODY SCIENCE</p>
        <h1>
          カラダは、
          <br />
          <em>遊べる</em>実験室。
        </h1>
        <p className="hero-lead">
          読むだけの健康情報は、もう終わり。3Dの骨格に触れ、腹圧を操作し、自分の眼と平衡感覚をテストする —
          理学療法と機能神経学の世界を「体験」から学ぶラボです。
        </p>
        <div className="hero-cta">
          <a href="#bodymap" className="cta-primary">
            骨格マップから始める ↓
          </a>
          <a href="#neuro" className="cta-ghost">
            神経系をテストする
          </a>
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-inner">
          {MARQUEE.repeat(4)}
          {MARQUEE.repeat(4)}
        </div>
      </div>
    </header>
  );
}
