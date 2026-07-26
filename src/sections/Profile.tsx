/**
 * トップページのヒーロー(自己紹介)
 * 文言を書き換えるだけでプロフィールを更新できます。
 */
export function Profile() {
  return (
    <header className="hero profile-hero">
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-inner">
        <p className="hero-kicker">からだの保健室</p>
        <h1>
          からだのことを、
          <br />
          <em>わかる</em>ことばで。
        </h1>
        <p className="hero-lead">
          理学療法士のtomyです。痛みや不調の「なぜ」を、解剖学と神経科学の視点からできるだけやさしく解きほぐしていきます。読むだけでなく、3Dモデルやシミュレーターで“体感”しながら学べる保健室です。
        </p>

        <div className="profile-meta">
          <div className="profile-meta-item">
            <span>PROFILE</span>
            <b>tomy / 理学療法士・修士</b>
          </div>
          <div className="profile-meta-item">
            <span>FIELD</span>
            <b>姿勢・腰痛・体幹・機能神経学・栄養</b>
          </div>
        </div>

        <div className="hero-cta">
          <a href="#bodymap" className="cta-primary">
            気になる部位から探す ↓
          </a>
          <a href="#articles" className="cta-ghost">
            記事を読む
          </a>
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-inner">
          {'からだの保健室 — 姿勢 — 腰痛 — 体幹 — 神経 — 栄養 — '.repeat(4)}
          {'からだの保健室 — 姿勢 — 腰痛 — 体幹 — 神経 — 栄養 — '.repeat(4)}
        </div>
      </div>
    </header>
  );
}
