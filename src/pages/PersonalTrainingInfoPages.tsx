import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FirstTrialOffer } from '../components/FirstTrialOffer';

type InfoPageProps = {
  label: string;
  title: ReactNode;
  lead: string;
  children: ReactNode;
};

function InfoPage({ label, title, lead, children }: InfoPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="personal-info-page page-top-pad">
      <header className="personal-info-hero">
        <span className="section-index">{label}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </header>
      <div className="personal-info-content">{children}</div>
      <section className="personal-info-cta">
        <p>ご不明な点は、申し込みフォームの「ご利用の目的」にあわせてご記入ください。</p>
        <div className="personal-page-actions">
          <Link to="/personal-training/apply" className="cta-primary">申し込みフォームへ →</Link>
          <Link to="/personal-training" className="cta-ghost">サービス案内に戻る ←</Link>
        </div>
      </section>
    </div>
  );
}

const FIRST_STEPS = [
  ['01', 'フォームから申し込む', '希望日時、場所、コース、ご利用の目的をお知らせください。'],
  ['02', '日程と場所を決める', '内容を確認し、メールで実施日時と場所をご相談します。'],
  ['03', '問診票・同意書を入力する', '日程確定後にお送りします。当日までにご入力ください。'],
  ['04', '当日の評価とトレーニング', '体調と目的を確認し、無理のない内容から始めます。'],
];

export function PersonalTrainingFirstPage() {
  return (
    <InfoPage
      label="FIRST VISIT"
      title={<>初めての方へ。</>}
      lead="初回の申し込みから当日まで、必要なことをわかりやすくまとめました。"
    >
      <FirstTrialOffer />

      <section className="personal-info-block">
        <span className="section-index">WELCOME</span>
        <h2>運動に自信がなくても、<br />大丈夫です。</h2>
        <p>最初に姿勢や動き、現在の不安、目標を確認し、その日の状態に合わせて内容を組み立てます。きつい運動を一方的に行うサービスではありません。</p>
      </section>

      <section className="personal-info-block">
        <span className="section-index">AT HOME</span>
        <h2>女性お一人のご自宅でも<br />ご依頼いただけます。</h2>
        <p>お申し込み時に、ご自宅での実施を選択してください。不安な点や入室時の条件は事前にご相談いただけます。ご家族や同居人の立ち会いをご希望の場合もお知らせください。</p>
      </section>

      <section className="personal-info-block">
        <span className="section-index">PREPARATION</span>
        <h2>当日のご準備</h2>
        <ul className="personal-check-list">
          <li>動きやすい服装</li>
          <li>水分とタオル</li>
          <li>横になり、手足を動かせる程度のスペース</li>
          <li>必要に応じて、医師から受けている運動上の指示</li>
        </ul>
      </section>

      <section className="personal-info-block">
        <span className="section-index">STEPS</span>
        <h2>ご利用までの流れ</h2>
        <div className="personal-info-card-grid">
          {FIRST_STEPS.map(([number, title, description]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>
    </InfoPage>
  );
}

const BODY_CARE_FLOW = [
  ['01', 'カウンセリング', '困っている動作、日常生活で気になること、その日の体調や目標を確認します。'],
  ['02', '姿勢・動作の評価', '立つ・歩く・腕を上げるなど、目的に関係する動きを無理のない範囲で確認します。'],
  ['03', '必要な内容を提供', '評価をもとに、整体・身体調整、トレーニング、または両方を組み合わせて行います。'],
  ['04', '再評価・セルフケア', '前後の感覚や動き方を確認し、必要に応じて自宅で行えるケアや運動をご提案します。'],
];

export function PersonalTrainingBodyCarePage() {
  return (
    <InfoPage
      label="BODY CARE / CONDITIONING"
      title={<>整体・<br />身体調整。</>}
      lead="整体とトレーニングを分けず、身体の状態を評価したうえで、その日に必要なものを組み合わせて提供します。"
    >
      <FirstTrialOffer />

      <section className="personal-info-block personal-body-care-intro">
        <span className="section-index">HYBRID APPROACH</span>
        <h2>整体とトレーニングの<br />ハイブリッド。</h2>
        <p>最初に姿勢や動作を評価し、身体のどこに負担が集まっているかを整理します。整体が必要なのか、運動が必要なのか、その両方が必要なのかを判断し、一人ひとりに合う内容を組み立てます。</p>
      </section>

      <section className="personal-info-block">
        <span className="section-index">TODAY'S SESSION</span>
        <h2>当日の流れ</h2>
        <div className="personal-info-card-grid">
          {BODY_CARE_FLOW.map(([number, title, description]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="personal-info-block">
        <span className="section-index">FOR YOU</span>
        <h2>このような方へ</h2>
        <ul className="personal-check-list">
          <li>運動より先に、身体の状態を見てほしい</li>
          <li>慢性的なこわばりや動きにくさが気になる</li>
          <li>どこをセルフケアすればよいかわからない</li>
          <li>運動を始めたいが、身体への不安がある</li>
        </ul>
      </section>

      <section className="personal-info-block personal-body-care-note">
        <span className="section-index">IMPORTANT</span>
        <h2>内容を決めていなくても、<br />お申し込みいただけます。</h2>
        <p>「整体とトレーニングのどちらが必要かわからない」という方も、評価をもとにご提案します。整体だけ、トレーニングだけのご希望にも対応します。本サービスは医療行為ではなく、医学的な診断・治療の代わりとなるものではありません。</p>
      </section>
    </InfoPage>
  );
}

const FAQS = [
  ['女性一人の自宅でも依頼できますか？', 'はい、ご依頼いただけます。ご不安な点や入室時の条件、ご家族等の立ち会い希望があれば、日程調整時にお知らせください。'],
  ['自宅にはどのくらいの広さが必要ですか？', '横になり、手足を無理なく動かせるスペースが目安です。難しい場合は、近隣のレンタルジムをご案内します。'],
  ['運動経験がなくても大丈夫ですか？', '大丈夫です。運動歴や現在の状態を確認し、無理のない内容から始めます。'],
  ['痛みがあっても受けられますか？', '状態を確認しながら進めますが、強い痛み、しびれ、急な症状がある場合は先に医療機関へご相談ください。医師から運動制限を受けている場合も事前にお知らせください。'],
  ['用意するものはありますか？', '動きやすい服装、水分、タオルをご用意ください。ご自宅の場合は運動スペースの確保もお願いします。'],
  ['料金には何が含まれますか？', '中目黒・恵比寿・六本木・代官山の出張プランは出張費込みです。レンタルジム利用時はジム利用料も含みます。北品川プランは別料金です。'],
  ['希望日時が対応時間外でも申し込めますか？', 'はい。「その他の日時・要相談」としてお申し込みください。日程を確認して折り返しご連絡します。'],
  ['問診票や同意書はいつ入力しますか？', '日程と場所が確定した後、メールでご案内します。この申し込みフォームでは日程調整に必要な情報だけをうかがいます。'],
  ['キャンセルや日時変更はできますか？', '可能です。キャンセル規定は現在整備中のため、確定したご案内を日程調整時にお送りします。'],
  ['支払い方法は何がありますか？', '支払い方法は現在最終調整中です。日程確定時に利用可能な方法をご案内します。'],
];

export function PersonalTrainingFaqPage() {
  return (
    <InfoPage label="FAQ" title={<>よくある質問。</>} lead="初めての方から多くいただく質問をまとめています。">
      <section className="personal-info-block">
        <div className="personal-faq-list">
          {FAQS.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary><span>Q{String(index + 1).padStart(2, '0')}</span>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </InfoPage>
  );
}

export function PersonalTrainingVoicesPage() {
  return (
    <InfoPage label="STORIES" title={<>お客様の声。</>} lead="実際のサポート内容が伝わる事例を、許可をいただいたうえで掲載します。">
      <section className="personal-info-block personal-preparing-block">
        <span className="section-index">IN PREPARATION</span>
        <h2>掲載準備中です。</h2>
        <p>年齢、目的、身体の状態、取り組んだ内容、変化を、個人が特定されない形で紹介する予定です。実在しない感想や効果を掲載することはありません。</p>
      </section>
    </InfoPage>
  );
}

export function PersonalTrainingAreasPage() {
  return (
    <InfoPage label="AREA GUIDE" title={<>対応エリア。</>} lead="目黒区・渋谷区・港区の指定エリアを中心に、ご自宅またはレンタルジムへ伺います。">
      <section className="personal-info-block">
        <div className="personal-area-detail-grid">
          <article>
            <span>HOME VISIT</span>
            <h2>ご自宅への出張</h2>
            <p>目黒区・渋谷区・港区のうち、中目黒・恵比寿・代官山・六本木周辺を基本対応エリアとして、ご自宅へ訪問します。</p>
            <b>60分 ¥12,000 / 90分 ¥16,500</b>
          </article>
          <article>
            <span>RENTAL GYM</span>
            <h2>レンタルジム</h2>
            <p>中目黒（目黒区）・恵比寿、代官山（渋谷区）・六本木（港区）周辺で手配します。出張費・レンタルジム利用料込みです。</p>
            <b>60分 ¥12,000 / 90分 ¥16,500</b>
          </article>
          <article>
            <span>KITASHINAGAWA</span>
            <h2>北品川（品川区）</h2>
            <p>北品川駅から徒歩3分のパーソナルジムで実施します。場所の詳細は日程確定後にご案内します。</p>
            <b>別料金 / お問い合わせ</b>
          </article>
          <article>
            <span>OTHER AREA</span>
            <h2>その他のエリア</h2>
            <p>東京都内を中心に、移動時間や施設の状況によって対応できる場合があります。追加料金が必要な場合は、日程確定前にご案内します。</p>
            <b>まずは希望場所をご相談ください</b>
          </article>
        </div>
      </section>
    </InfoPage>
  );
}
