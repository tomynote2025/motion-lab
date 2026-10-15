import { useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const APPLICATION_EMAIL = 'be.come.tomy@gmail.com';

const AVAILABILITY = [
  ['WED / FRI', '水曜日・金曜日', '19:00〜22:00'],
  ['SAT', '土曜日', '17:00〜23:00'],
  ['SUN', '日曜日', '終日'],
  ['OTHER', 'その他の日時', '要相談'],
];

function PersonalTrainingApplyForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = '【出張整体・パーソナル】お申し込み';
    const body = [
      `お名前：${data.get('name') ?? ''}`,
      `メールアドレス：${data.get('email') ?? ''}`,
      `電話番号：${data.get('phone') ?? ''}`,
      `希望サービス：${data.get('service') ?? ''}`,
      `希望の実施方法：${data.get('location') ?? ''}`,
      `希望コース：${data.get('course') ?? ''}`,
      `第1希望：${data.get('firstChoice') ?? ''}`,
      `第2希望：${data.get('secondChoice') ?? ''}`,
      '',
      'ご利用の目的：',
      String(data.get('purpose') ?? ''),
    ].join('\n');

    window.location.href = `mailto:${APPLICATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form className="personal-apply-form" onSubmit={handleSubmit}>
      <div className="personal-form-grid">
        <label>
          <span>お名前 <b>*</b></span>
          <input name="name" type="text" required autoComplete="name" placeholder="山田 太郎" />
        </label>
        <label>
          <span>メールアドレス <b>*</b></span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </label>
      </div>

      <label>
        <span>電話番号（任意）</span>
        <input name="phone" type="tel" autoComplete="tel" placeholder="090-0000-0000" />
      </label>

      <div className="personal-form-grid">
        <label>
          <span>希望サービス <b>*</b></span>
          <select name="service" required defaultValue="">
            <option value="" disabled>選択してください</option>
            <option>身体を評価して提案してほしい</option>
            <option>整体・身体調整を中心に希望</option>
            <option>パーソナルトレーニングを中心に希望</option>
            <option>整体とトレーニングの両方を希望</option>
          </select>
        </label>
        <label>
          <span>希望の実施方法 <b>*</b></span>
          <select name="location" required defaultValue="">
            <option value="" disabled>選択してください</option>
            <option>ご自宅への出張</option>
            <option>中目黒のレンタルジム</option>
            <option>恵比寿のレンタルジム</option>
            <option>六本木のレンタルジム</option>
            <option>代官山のレンタルジム</option>
            <option>北品川のパーソナルジム</option>
            <option>その他・相談したい</option>
          </select>
        </label>
        <label>
          <span>希望コース <b>*</b></span>
          <select name="course" required defaultValue="">
            <option value="" disabled>選択してください</option>
            <option>先着10名 初回体験 90分 / 12,000円</option>
            <option>60分 / 12,000円</option>
            <option>90分 / 16,500円</option>
            <option>北品川ジムプラン</option>
            <option>相談して決めたい</option>
          </select>
        </label>
      </div>

      <div className="personal-form-grid">
        <label>
          <span>第1希望日時 <b>*</b></span>
          <input name="firstChoice" type="datetime-local" required />
        </label>
        <label>
          <span>第2希望日時（任意）</span>
          <input name="secondChoice" type="datetime-local" />
        </label>
      </div>

      <label>
        <span>ご利用の目的 <b>*</b></span>
        <textarea
          name="purpose"
          required
          rows={6}
          placeholder="例：リハビリ終了後も運動を続けたい、姿勢や動き方を見てほしい、競技パフォーマンスを高めたい など"
        />
      </label>

      <div className="personal-form-followup">
        <b>問診票・同意書は日程確定後にご案内します。</b>
        <p>このフォームでは、日程調整に必要な最小限の情報のみをうかがいます。</p>
      </div>

      <button type="submit">入力内容を確認してメールを開く →</button>
      <p className="personal-form-note">入力内容を反映した状態でメールアプリが開きます。送信はメールアプリ内で行ってください。</p>
    </form>
  );
}

export function PersonalTrainingApplyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="personal-apply-page page-top-pad">
      <header className="personal-apply-hero">
        <span className="section-index">APPLICATION</span>
        <h1>出張サービス<br /><em>お申し込み。</em></h1>
        <p>希望内容を送信いただいた後、日程と実施場所を調整します。</p>
      </header>

      <section className="personal-availability-section">
        <div className="personal-section-heading">
          <span className="section-index">AVAILABLE HOURS</span>
          <h2>対応可能時間</h2>
        </div>
        <div className="personal-availability-grid">
          {AVAILABILITY.map(([label, day, time]) => (
            <article key={label}>
              <span>{label}</span>
              <b>{day}</b>
              <strong>{time}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="personal-apply-section">
        <div className="personal-apply-intro">
          <span className="section-index">FORM</span>
          <h2>希望内容を<br />お聞かせください。</h2>
          <p><b>*</b> は必須項目です。</p>
          <Link to="/personal-training">サービス案内に戻る ←</Link>
        </div>
        <PersonalTrainingApplyForm />
      </section>
    </div>
  );
}
