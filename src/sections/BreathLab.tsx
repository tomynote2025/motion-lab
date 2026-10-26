import { useEffect, useRef, useState } from 'react';
import { LabHead } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';

/**
 * BREATH LAB — 呼吸と自律神経(ゆっくり呼吸のガイド)
 *
 * 根拠(文言の範囲):
 *  - 息を吸うと心拍が少し速く、吐くと少し遅くなる(呼吸性洞性不整脈)。
 *  - 1分間に約6回(約0.1Hz)のゆっくり呼吸では、この揺れが大きくなり、心拍変動(HRV)が高まる
 *    (Sevoz-Couche & Laborde 2022, Neurosci Biobehav Rev 135:104576)。
 *  - 223研究のメタ分析: ゆっくり呼吸の最中は迷走神経由来のHRV(RMSSD)が中程度に増える。
 *    終わった直後や数回の練習後の増加は小さい。多くの研究でバイアスのリスクが高い
 *    (Laborde ら 2022, Neurosci Biobehav Rev 138:104711)。
 *  - 画面の心拍の波は、上の仕組みを示すモデル図。実際の心拍は測っていない。
 */

type Pattern = { id: string; label: string; inhale: number; exhale: number; note: string };
const PATTERNS: Pattern[] = [
  { id: 'slow55', label: '1分6回（吸う5秒・吐く5秒）', inhale: 5, exhale: 5, note: '研究でよく使われる、約0.1Hzのゆっくり呼吸です。' },
  { id: 'slow46', label: '1分6回（吸う4秒・吐く6秒）', inhale: 4, exhale: 6, note: '吐く時間を長めにした型です。苦しくなければ、こちらでもかまいません。' },
  { id: 'normal', label: '比較：1分10回（吸う3秒・吐く3秒）', inhale: 3, exhale: 3, note: 'ふだんに近い速さの呼吸です。心拍の揺れの大きさを比べてみてください。' },
];
const DURATIONS = [1, 3, 5];

export function BreathLab() {
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!running) return;
    const loop = () => {
      const t = (performance.now() - start.current) / 1000;
      setElapsed(t);
      if (t >= minutes * 60) {
        setRunning(false);
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, minutes]);

  const cycle = pattern.inhale + pattern.exhale;
  const inCycle = running ? elapsed % cycle : 0;
  const inhaling = inCycle < pattern.inhale;
  // 0(吐ききった)〜1(吸いきった)。ゆるやかに変化させる
  const lung = inhaling
    ? 0.5 - 0.5 * Math.cos((Math.PI * inCycle) / pattern.inhale)
    : 0.5 + 0.5 * Math.cos((Math.PI * (inCycle - pattern.inhale)) / pattern.exhale);
  const secLeft = Math.ceil(inhaling ? pattern.inhale - inCycle : cycle - inCycle);
  const rate = 60 / cycle;

  // 心拍の揺れのモデル: 1分6回付近で揺れが最大になる(共鳴)ことを示すための図
  const swing = 3 + 9 * Math.exp(-((rate - 6) ** 2) / 4.5);
  const hrPoints = Array.from({ length: 120 }, (_, i) => {
    const tt = (running ? elapsed : 0) - (119 - i) * 0.1;
    const ph = ((tt % cycle) + cycle) % cycle;
    const l = ph < pattern.inhale ? 0.5 - 0.5 * Math.cos((Math.PI * ph) / pattern.inhale) : 0.5 + 0.5 * Math.cos((Math.PI * (ph - pattern.inhale)) / pattern.exhale);
    const hr = 66 + swing * (l - 0.5) * 2;
    return `${(i / 119) * 400},${60 - (hr - 66) * 3.2}`;
  }).join(' ');

  const total = minutes * 60;
  const remain = Math.max(0, Math.ceil(total - elapsed));

  return (
    <section id="breath" className="section">
      <LabHead
        id="breath"
        lead="息を吸うと心拍は少し速くなり、吐くと少し遅くなります。この揺れは自律神経（とくに副交感神経の働き）を映す指標のひとつです。1分間に6回前後のゆっくりした呼吸では、この揺れが大きくなることが知られています。"
        steps="呼吸のペースと時間を選んで「はじめる」。円が大きくなるときに吸い、小さくなるときに吐きます。"
        read="このラボは心拍を測りません。下の波は、ゆっくり呼吸で心拍の揺れが大きくなる様子のモデル図です。終わったあと、楽に感じたかどうかを目安にしてください。"
      />

      <div className="position-grid">
        <div className="position-stage breath-stage">
          <div className="position-stage-head">
            <span>{running ? `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}` : 'BREATH PACER'}</span>
            <b>{running ? (inhaling ? '鼻から、ゆっくり吸う' : 'ゆっくり、吐く') : '「はじめる」で開始'}</b>
          </div>
          <div className="breath-center">
            {running ? (
              <div className="breath-ring" style={{ transform: `scale(${0.45 + lung * 0.55})` }} />
            ) : (
              <div className="breath-ring breath-ring-idle" style={{ animationDuration: `${cycle}s` }} />
            )}
            <div className="breath-label">
              <b>{running ? (inhaling ? '吸う' : '吐く') : '見本'}</b>
              <span>{running ? secLeft : `1分${Math.round(rate)}回`}</span>
            </div>
          </div>
          <div className="breath-hr">
            <span>心拍のゆらぎ（モデル図）</span>
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(239,234,220,0.15)" />
              <polyline points={hrPoints} fill="none" stroke="#e0a95b" strokeWidth="2.2" />
            </svg>
            <p>吸うと上がり、吐くと下がります。1分6回のときに揺れが大きくなる様子を表した図で、あなたの心拍を測っているわけではありません。</p>
          </div>
        </div>

        <div className="position-controls">
          <div className="region-chips breath-patterns" role="radiogroup" aria-label="呼吸のペース">
            {PATTERNS.map((p) => (
              <button key={p.id} className={`chip ${pattern.id === p.id ? 'chip-active' : ''}`} disabled={running} onClick={() => setPattern(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="lr-note">{pattern.note}</p>
          <div className="region-chips" role="radiogroup" aria-label="時間">
            {DURATIONS.map((d) => (
              <button key={d} className={`chip ${minutes === d ? 'chip-active' : ''}`} disabled={running} onClick={() => setMinutes(d)}>
                {d}分
              </button>
            ))}
          </div>
          {running ? (
            <button className="lr-sub-btn" onClick={() => setRunning(false)}>終了する</button>
          ) : (
            <button
              className="start-btn position-main-btn"
              onClick={() => {
                start.current = performance.now();
                setElapsed(0);
                setRunning(true);
              }}
            >
              はじめる（{minutes}分）
            </button>
          )}
          <div className="lr-howto">
            <p><b>やり方のコツ</b></p>
            <ol>
              <li>楽な姿勢で座り、肩の力を抜きます。</li>
              <li>大きく吸い込みすぎず、おなかや胸の下の方が広がるのを感じながら、ゆっくり呼吸します。</li>
              <li>苦しい・頭がふらつくと感じたら、すぐにふだんの呼吸に戻してください。</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>RESONANCE</span>
          <b>なぜ1分6回？</b>
          <p>心拍と血圧には、およそ10秒（0.1Hz）周期の自然なリズムがあります。呼吸をこのリズムに合わせると、吸う・吐くに伴う心拍の揺れが重なって大きくなり、心拍変動が高まると考えられています。最適な回数には個人差があります。</p>
        </div>
        <div>
          <span>EVIDENCE</span>
          <b>どのくらい効果がある？</b>
          <p>223の研究をまとめた報告では、ゆっくり呼吸をしている最中は、副交感神経の働きを表す心拍変動が中程度に増えていました。一方、終わった後や練習を重ねた後の増加は小さく、多くの研究で質に課題がありました。</p>
        </div>
        <div>
          <span>NOTE</span>
          <b>大切なこと</b>
          <p>ゆっくり呼吸は、気持ちを落ち着けたいときに手軽に試せる方法のひとつです。ただし病気の治療の代わりにはなりません。息苦しさや動悸が続く場合は、医療機関にご相談ください。</p>
        </div>
      </div>
      <WhyQuiz
        question="心拍のゆらぎが大きくなりやすいのは、1分間に何回くらいの呼吸？"
        choices={["約6回", "約15回", "約30回"]}
        answer={0}
        explain="ふだんの呼吸は1分間に12〜20回ほどですが、1分間に6回前後のゆっくりした呼吸では、吸う・吐くに合わせた心拍の揺れが大きくなることが知られています。体のリズムと呼吸のリズムが重なるためと考えられています。"
      />
      <p className="neuro-caution">
        参考: Laborde S ら (2022) Effects of voluntary slow breathing on heart rate and heart rate variability: a systematic review and a meta-analysis. Neurosci Biobehav Rev 138:104711／Sevoz-Couche C, Laborde S (2022) Heart rate variability and slow-paced breathing: when coherence meets resonance. Neurosci Biobehav Rev 135:104576。
      </p>
    </section>
  );
}
