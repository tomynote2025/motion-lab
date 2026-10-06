import { Link } from 'react-router-dom';

export function PersonalTrainingPromo() {
  return (
    <section className="personal-promo" aria-labelledby="personal-promo-title">
      <div className="personal-promo-topline">
        <span>VISITING PERSONAL TRAINING</span>
        <span>理学療法士による個別サポート</span>
      </div>

      <div className="personal-promo-grid">
        <div>
          <span className="personal-promo-index">PERSONAL / 01</span>
          <h2 id="personal-promo-title">
            あなたの場所で、<br />
            <em>からだと向き合う。</em>
          </h2>
        </div>

        <div className="personal-promo-copy">
          <p>
            レンタルジム等で、一人ひとりの目的や身体の状態に合わせて行う出張パーソナルトレーニングです。
            中目黒・恵比寿・六本木・代官山と、北品川のパーソナルジムで対応します。
          </p>
          <Link to="/personal-training" className="personal-promo-link">
            出張パーソナルの案内を見る <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
