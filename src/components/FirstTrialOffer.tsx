import { Link } from 'react-router-dom';

export function FirstTrialOffer() {
  return (
    <section className="first-trial-offer" aria-label="初回体験のご案内">
      <div>
        <span>FIRST 10 CLIENTS / LIMITED OFFER</span>
        <p>先着10名・初回限定</p>
        <h2>まずは、身体の状態を知る90分。</h2>
        <small>姿勢・動作を評価し、整体とトレーニングから必要な内容を組み合わせます。</small>
      </div>
      <div className="first-trial-price">
        <span>90 MIN</span>
        <strong>¥12,000<small>税込</small></strong>
        <p>出張費・レンタルジム利用料込み</p>
        <Link to="/personal-training/apply">初回体験を申し込む →</Link>
      </div>
    </section>
  );
}
