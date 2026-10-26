import { useState } from 'react';
import { LabHead, LabMore } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';

/**
 * PAIN VOLUME LAB — 痛みのボリュームつまみ
 *
 * 根拠(文言の範囲):
 *  - 同じ冷たい刺激でも、赤い合図と一緒だと青い合図より「熱く・痛く」感じた
 *    (11段階で、熱さ約5.5・不快さ約3.5・強さ約3の差)。Moseley & Arntz 2007, Pain。
 *    ただし、脅威の大きさを本当に変えられていたかには異論もある。
 *  - 「危険の手がかり」と「安全の手がかり」で痛みが調整されるという考え方は、痛みの教育で使われる説明モデル
 *    (Moseley & Butler 2015, J Pain)。数式は説明のための単純化。
 *  - 痛みの教育(PNE)のメタ分析: 恐怖心(運動恐怖)や破局的思考は改善、痛みの強さや生活の支障への効果は小さい
 *    (Watson ら 2019, J Pain)。
 */

const DANGER = [
  '前にも同じ場所を痛めた',
  '「骨がずれている」と言われて不安',
  'よく眠れていない',
  '仕事や家庭のストレスが強い',
  '痛みのことばかり考えてしまう',
];
const SAFETY = [
  '痛みの仕組みを知っている',
  '信頼できる人がそばにいる',
  'よく眠れた',
  '好きなことに夢中になっている',
  '動いても大丈夫だと分かっている',
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function Knob({ value }: { value: number }) {
  // 0〜10 を -135°〜135° に
  const angle = -135 + (value / 10) * 270;
  const r = 70;
  const arc = (from: number, to: number) => {
    const p = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${100 + r * Math.cos(rad)} ${100 + r * Math.sin(rad)}`;
    };
    const large = to - from > 180 ? 1 : 0;
    return `M ${p(from)} A ${r} ${r} 0 ${large} 1 ${p(to)}`;
  };
  return (
    <svg viewBox="0 0 200 200" className="pain-knob" aria-label={`痛みのボリューム ${value.toFixed(1)}`}>
      <path d={arc(-135, 135)} stroke="rgba(239,234,220,0.15)" strokeWidth="14" fill="none" strokeLinecap="round" />
      {value > 0.05 && <path d={arc(-135, angle)} stroke="#e07a52" strokeWidth="14" fill="none" strokeLinecap="round" />}
      <circle cx="100" cy="100" r="48" fill="#22382c" stroke="rgba(239,234,220,0.25)" />
      <line
        x1="100"
        y1="100"
        x2={100 + 38 * Math.cos(((angle - 90) * Math.PI) / 180)}
        y2={100 + 38 * Math.sin(((angle - 90) * Math.PI) / 180)}
        stroke="#efeadc"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text x="100" y="178" textAnchor="middle" className="pain-knob-num">{value.toFixed(1)}</text>
    </svg>
  );
}

export function PainVolumeLab() {
  const [stimulus, setStimulus] = useState(5);
  const [danger, setDanger] = useState<boolean[]>(DANGER.map(() => false));
  const [safety, setSafety] = useState<boolean[]>(SAFETY.map(() => false));

  const d = danger.filter(Boolean).length;
  const s = safety.filter(Boolean).length;
  // 説明用のモデル: 刺激が同じでも、危険の手がかりで上がり、安全の手がかりで下がる
  const volume = clamp(stimulus * (1 + 0.14 * d - 0.1 * s), 0, 10);
  const diff = volume - stimulus;

  const toggle = (list: boolean[], set: (v: boolean[]) => void, i: number) => set(list.map((v, j) => (j === i ? !v : v)));

  return (
    <section id="pain" className="section">
      <LabHead
        id="pain"
        lead="痛みは、体からの信号の大きさだけで決まるわけではありません。脳はその信号を、過去の経験・今の状況・気持ちなどと合わせて「どのくらい守る必要があるか」を判断し、痛みの強さを調整していると考えられています。"
        steps="体からの信号の強さを決め、危険を思わせる手がかり・安全を思わせる手がかりを選んで、つまみの目盛りがどう変わるかを見ます。"
        read="同じ信号でも、手がかりによって痛みのボリュームが上下する、という考え方のモデルです。数値は実際の痛みの強さを表すものではありません。"
      />

      <div className="position-notice">
        <b>大切な前提</b>
        <p>痛みは「気のせい」ではありません。しびれ・力の入りにくさ・発熱・夜も続く痛み・けがのあとの強い痛みがあるときは、医療機関を受診してください。</p>
      </div>

      <div className="position-grid">
        <div className="position-stage pain-stage">
          <div className="position-stage-head">
            <span>PAIN VOLUME（モデル）</span>
            <b>痛みのボリューム</b>
          </div>
          <div className="pain-center">
            <Knob value={volume} />
            <p className="pain-delta">
              体からの信号 {stimulus.toFixed(1)} →{' '}
              <b className={diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : ''}>
                感じる痛み {volume.toFixed(1)}（{diff > 0.05 ? '大きくなった' : diff < -0.05 ? '小さくなった' : '変わらない'}）
              </b>
            </p>
          </div>
          <label className="slider-row pain-slider">
            <span className="slider-name" style={{ color: '#efeadc' }}>体からの信号</span>
            <input type="range" min="0" max="10" step="0.5" value={stimulus} onChange={(e) => setStimulus(+e.target.value)} />
            <span className="slider-val" style={{ color: '#efeadc' }}>{stimulus.toFixed(1)}</span>
          </label>
        </div>

        <div className="position-controls">
          <div>
            <p className="pain-group danger">危険を思わせる手がかり（ボリュームを上げる）</p>
            <div className="region-chips">
              {DANGER.map((label, i) => (
                <button key={label} className={`chip pain-chip-danger ${danger[i] ? 'chip-active' : ''}`} onClick={() => toggle(danger, setDanger, i)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="pain-group safety">安全を思わせる手がかり（ボリュームを下げる）</p>
            <div className="region-chips">
              {SAFETY.map((label, i) => (
                <button key={label} className={`chip pain-chip-safety ${safety[i] ? 'chip-active' : ''}`} onClick={() => toggle(safety, setSafety, i)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="lr-mini">ボリュームの計算は、考え方を伝えるための単純なモデルです。実際の痛みの強さを予測するものではありません。</p>
        </div>
      </div>

      <div className="pain-exp">
        <div className="pain-exp-head">
          <span>EXPERIMENT</span>
          <b>同じ冷たさでも、色の合図で痛みが変わった実験</b>
        </div>
        <div className="pain-exp-body">
          <div className="pain-cue red">赤い合図<small>（熱そう・危なそう）</small></div>
          <div className="pain-cue blue">青い合図<small>（冷たそう）</small></div>
          <p>
            手に同じ冷たい刺激を一瞬当てるとき、赤い合図を見せると、青い合図のときより「熱い」「痛い」と感じられました。11段階の評価で、痛みの強さは約3ポイント、不快さは約3.5ポイント高くなりました。刺激は同じでも、意味づけで痛みが変わりうることを示した研究です。ただし実験室での短い刺激の結果で、解釈には異論もあります。
          </p>
        </div>
      </div>

      <WhyQuiz
        question="同じ冷たい刺激でも、赤い合図のときのほうが「熱い・痛い」と感じられた実験。どう説明される？"
        choices={["赤い光で皮膚の温度が上がったから", "脳が「危なそう」という手がかりも合わせて痛みを調整しているから", "気のせいで、実際は何も感じていないから"]}
        answer={1}
        explain="脳は、体からの信号だけでなく、目に入る手がかりや過去の経験も合わせて、どのくらい守る必要があるかを判断していると考えられています（Moseley & Arntz 2007）。気のせいではなく、本当に感じ方が変わります。"
      />
      <LabMore>
        <div className="lr-evidence">
          <div>
            <span>MODEL</span>
            <b>危険と安全の手がかり</b>
            <p>痛みの教育では、体の状態だけでなく、経験・考え方・環境なども「危険の手がかり」や「安全の手がかり」として痛みを調整する、と説明します。このつまみは、その考え方を体験するための図です。</p>
          </div>
          <div>
            <span>EVIDENCE</span>
            <b>知ると痛みは減る？</b>
            <p>痛みの仕組みを学ぶ教育をまとめた研究では、動くことへの怖さや、痛みを悪く考えすぎる傾向は改善しました。一方、痛みの強さや生活の支障への効果は小さいとされています。運動など、ほかの方法と組み合わせることが大切です。</p>
          </div>
          <div>
            <span>USE</span>
            <b>日常での使い方</b>
            <p>痛みが強い日は「今日はどんな手がかりが多いか」を振り返ってみてください。睡眠や不安など、体以外に整えられることが見つかるかもしれません。</p>
          </div>
        </div>
        <p className="neuro-caution">
          参考: Moseley GL, Arntz A (2007) The context of a noxious stimulus affects the pain it evokes. Pain／Moseley GL, Butler DS (2015) Fifteen years of explaining pain: the past, present, and future. J Pain／Watson JA ら (2019) Pain neuroscience education for adults with chronic musculoskeletal pain: a mixed-methods systematic review and meta-analysis. J Pain。
        </p>
      </LabMore>
    </section>
  );
}
