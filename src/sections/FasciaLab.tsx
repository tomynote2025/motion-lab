import { useEffect, useRef, useState } from 'react';
import { LabHead, LabMore } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';

/**
 * FASCIA LAB — 筋膜の層
 * パドヴァ大学 Stecco らの筋膜解剖学(Fascial Manipulation)を参考に、
 * 浅筋膜(皮下脂肪の中の、伸び縮みするネット)と、深筋膜(重なった層と、その間の液＝ヒアルロン酸)を見せる。
 *
 * わかりやすさのために3段で見せる:
 *   1. 腕の輪切り … 皮膚・皮下脂肪・浅筋膜・深筋膜・筋肉・骨が、体のどこにあるか
 *   2. 拡大図     … 輪切りの一部を拡大した平面の図。層を指で左右に動かして滑り方を見る
 *                    浅筋膜は「ネットの弾力（しっかり〜ゆるい）」、深筋膜は「層の間の液（サラサラ〜ドロドロ）」で変える
 *   3. 自分で試す … 手の甲の皮膚をつまむ／前腕に手を当てて指を動かす
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t, 0, 1)))).join(',')})`;
}

type Mode = 'superficial' | 'deep';

/** 層の色 */
const C = {
  skin: '#e2b497',
  fat: '#efd48e',
  fatDot: '#e3c272',
  sf: '#86B98C',
  df: '#a9c0cf',
  thin: '#5a8197',
  muscle: '#b9584a',
  muscleLine: '#9c4639',
  bone: '#efeadc',
  active: '#C0562F',
  text: '#efeadc',
  muted: '#a4b8ab',
};

export function FasciaLab() {
  const [mode, setMode] = useState<Mode>('superficial');
  return (
    <section id="fascia" className="section">
      <LabHead
        id="fascia"
        lead="筋膜は、筋肉を包むだけでなく、体の各部をつないでいる膜です。腕の輪切りで、皮膚の下にある「浅筋膜」と、筋肉を包む「深筋膜」の場所を確かめてから、層どうしがどう滑るかを拡大図で見ます。"
        steps="腕の輪切りで層の場所を確かめ、タブで浅筋膜・深筋膜を選びます。拡大図の層を指で左右に動かし、スライダーで状態を変えて比べます。最後に、自分の体でも試せます。"
        read="層がなめらかに滑って元に戻れば、動きやすい状態のモデルです。滑りが悪くなる「高密度化」は Stecco らが提唱する考え方で、体の中での検証はまだ限られています。"
      />

      <div className="fascia-principles">
        <div><span>01</span><b>局所だけで見ない</b><p>痛む場所と、動きが乱れる原因候補は同じとは限りません。</p></div>
        <div><span>02</span><b>動きの連続性を見る</b><p>筋膜を、身体各部の張力と運動をつなぐシステムとして捉えます。</p></div>
        <div><span>03</span><b>滑りの悪い所を探す</b><p>層の滑りが悪くなった状態を Stecco らは「高密度化」と呼び、動きの検査と触診を組み合わせて探します。</p></div>
      </div>

      <div className="neuro-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'superficial'} className={mode === 'superficial' ? 'tab-active' : ''} onClick={() => setMode('superficial')}>
          浅筋膜<span>皮膚のすぐ下の膜</span>
        </button>
        <button role="tab" aria-selected={mode === 'deep'} className={mode === 'deep' ? 'tab-active' : ''} onClick={() => setMode('deep')}>
          深筋膜<span>筋肉を包む膜</span>
        </button>
      </div>

      <ArmCrossSection mode={mode} />
      <LayerLab key={mode} mode={mode} />

      <WhyQuiz
        question="「温めると筋膜の滑りがよくなる」は、どこまで確かめられている？"
        choices={["体の中でも確かめられている", "試験管では関係が示されたが、体の中ではまだ確かめられていない", "まったく根拠がない"]}
        answer={1}
        explain="筋膜の層の間にあるヒアルロン酸は、温度が上がると粘りが下がることが試験管の実験で示されています（Matteini ら 2009）。ただし、体の中で同じことが起きて滑りがよくなるかは、まだ確かめられていません。"
      />
      <LabMore>
        <p className="neuro-caution">
          参考: Fascial Manipulation® Institute by Stecco の方法論、およびC. &amp; A. Steccoらの筋膜解剖研究／Matteini P ら (2009) Biomacromolecules（ヒアルロン酸の温度による変化）。「高密度化」は Stecco らが提唱する考え方で、体の中での検証はまだ限られています。腕の輪切りと拡大図は、層の並びを伝えるための模式図で、厚さや形は実際とは異なります。本コンテンツは概念を体感する教育用モデルで、触診・評価・治療を再現するものではありません。
        </p>
      </LabMore>
    </section>
  );
}

/* =============== 1. 腕の輪切り（どこの話か） =============== */

function ArmCrossSection({ mode }: { mode: Mode }) {
  const cx = 118;
  const cy = 152;
  const at = (r: number, deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const sfOn = mode === 'superficial';
  const labels: { text: string; r: number; deg: number; on?: boolean }[] = [
    { text: '皮膚', r: 102, deg: -38 },
    { text: '皮下脂肪', r: 95, deg: -18 },
    { text: '浅筋膜', r: 88, deg: 0, on: sfOn },
    { text: '深筋膜', r: 73, deg: 20, on: !sfOn },
    { text: '筋肉', r: 48, deg: 60 },
  ];
  return (
    <div className="fascia-where">
      <svg viewBox="0 0 340 280" role="img" aria-label="腕の輪切り。外側から皮膚、皮下脂肪（中に浅筋膜）、深筋膜、筋肉、骨">
        <text x="14" y="22" fontSize="11" fill={C.muted} letterSpacing="1.5">腕の輪切り（模式図）</text>
        <circle cx={cx} cy={cy} r="106" fill={C.skin} />
        <circle cx={cx} cy={cy} r="99" fill={C.fat} />
        <circle cx={cx} cy={cy} r="88" fill="none" stroke={sfOn ? C.active : C.sf} strokeWidth={sfOn ? 3.5 : 2} strokeDasharray="5 4" />
        <circle cx={cx} cy={cy} r="74" fill={sfOn ? C.df : C.active} />
        <circle cx={cx} cy={cy} r="70" fill={C.muscle} />
        <line x1={cx - 70} y1={cy + 12} x2={cx + 70} y2={cy - 10} stroke={sfOn ? C.df : C.active} strokeWidth="2.5" />
        <circle cx={cx + 4} cy={cy + 10} r="17" fill={C.bone} />
        {/* 拡大する部分 */}
        <rect x={cx - 26} y={cy - 110} width="52" height="44" rx="6" fill="none" stroke={C.text} strokeWidth="1.6" strokeDasharray="4 3" />
        <text x={cx + 32} y={cy - 92} fontSize="11.5" fontWeight="700" fill={C.text}>
          ← この部分を下で拡大
        </text>
        {labels.map((l) => {
          const [x, y] = at(l.r, l.deg);
          return (
            <g key={l.text}>
              <circle cx={x} cy={y} r="2.6" fill={l.on ? C.active : C.text} />
              <line x1={x} y1={y} x2="244" y2={y} stroke={l.on ? C.active : C.text} strokeWidth="1" opacity={l.on ? 1 : 0.55} />
              <text x="250" y={y + 4} fontSize="13" fontWeight={l.on ? 900 : 700} fill={l.on ? '#f0915f' : C.text}>
                {l.text}
              </text>
            </g>
          );
        })}
        <line x1={cx + 16} y1={cy + 18} x2="244" y2={cy + 80} stroke={C.text} strokeWidth="1" opacity="0.55" />
        <text x="250" y={cy + 84} fontSize="13" fontWeight="700" fill={C.text}>骨</text>
      </svg>
    </div>
  );
}

/* =============== 2. 拡大図（指で動かす） =============== */

const W = 360;
const X0 = 10;
const X1 = 236;
// 層の上端と厚さ（上から順に）
const L = {
  skin: { y: 14, h: 22 },
  fatUp: { y: 36, h: 38 },
  sf: { y: 74, h: 8 },
  fatLow: { y: 82, h: 30 },
  dfA: { y: 112, h: 13 },
  liq: { y: 125, h: 17 },
  dfB: { y: 142, h: 13 },
  muscle: { y: 155, h: 75 },
};
const H = 236;
const MID = (X0 + X1) / 2; // 目印を置く横位置

function LayerLab({ mode }: { mode: Mode }) {
  const deep = mode === 'deep';
  const [param, setParam] = useState(deep ? 0.25 : 0.2); // 浅: ゆるさ（0=しっかり）／深: 液のねばり（0=サラサラ）
  const [shift, setShift] = useState(0); // 動かす層のずれ(-1..1)
  const [warmth, setWarmth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [auto, setAuto] = useState(false);
  const drag = useRef({ on: false, x0: 0, s0: 0, w: 1 });
  const warming = useRef(false);
  const autoStart = useRef(0);
  const shiftRef = useRef(0);
  const paramRef = useRef(param);
  const autoRef = useRef(false);
  shiftRef.current = shift;
  paramRef.current = param;
  autoRef.current = auto;

  const maxShift = deep ? 1 : 0.55 + param * 0.45; // 浅筋膜がゆるいほど皮膚が大きくずれる

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (autoRef.current) {
        // 自動で「すっと動かして、離す」
        const t = (performance.now() - autoStart.current) / 1000;
        const max = deep ? 1 : 0.55 + paramRef.current * 0.45;
        if (t < 0.8) setShift(easeOut(t / 0.8) * max);
        else if (t > 1.2) setAuto(false);
      } else if (!drag.current.on) {
        // 離すと戻る。浅筋膜は弾力が弱い（ゆるい）ほどゆっくり戻る
        const rate = deep ? 0.1 : 0.02 + (1 - paramRef.current) * 0.16;
        setShift((s) => (Math.abs(s) < 0.002 ? 0 : s * (1 - rate)));
      }
      if (deep) {
        setWarmth((w) => {
          const target = warming.current ? 1 : 0;
          const nw = lerp(w, target, warming.current ? 0.035 : 0.01);
          return Math.abs(nw - target) < 0.004 ? target : nw;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [deep]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (auto) return;
    drag.current = { on: true, x0: e.clientX, s0: shiftRef.current, w: e.currentTarget.getBoundingClientRect().width };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.on) return;
    const dx = ((e.clientX - drag.current.x0) / drag.current.w) * 3.2;
    setShift(clamp(drag.current.s0 + dx, -maxShift, maxShift));
  };
  const onUp = () => {
    drag.current.on = false;
    setDragging(false);
  };
  const play = () => {
    autoStart.current = performance.now();
    setAuto(true);
  };

  // ---- 状態から、各層のずれ(px)を決める ----
  const visc = deep ? clamp(param * (1 - 0.75 * warmth), 0.03, 1) : 0; // 実際のねばり（温めると一時的に下がる）
  const D = shift * (deep ? 46 : 40);
  const off = deep
    ? { skin: 0, fatUp: 0, sf: 0, fatLow: 0, dfA: D, dfB: D * visc, muscle: D * visc * 0.6 }
    : { skin: D, fatUp: D * 0.72, sf: D * 0.45, fatLow: D * 0.2, dfA: 0, dfB: 0, muscle: 0 };

  // ---- 目安（言葉） ----
  const level = param < 0.34 ? 0 : param < 0.67 ? 1 : 2;
  const effLevel = deep ? (visc < 0.34 ? 0 : visc < 0.67 ? 1 : 2) : level;
  const paramWord = deep ? ['サラサラ', 'とろっと', 'ドロドロ'][effLevel] : ['しっかり', 'ふつう', 'ゆるい'][level];
  const g1 = deep
    ? { value: 1 - visc, label: '層どうしの滑り', word: ['なめらか', 'やや悪い', '悪い'][effLevel] }
    : { value: 1 - param, label: '戻る力', word: ['よく戻る', 'ふつう', '戻りにくい'][level] };
  const g2 = deep
    ? { value: 0.45 + 0.55 * (1 - visc), label: '動く範囲', word: ['広い', 'やや狭い', '狭い'][effLevel] }
    : { value: Math.abs(shift) / 1, label: '皮膚のずれ', word: Math.abs(shift) > 0.66 ? '大きい' : Math.abs(shift) > 0.33 ? '中くらい' : '小さい' };

  const verdict = deep
    ? warmth > 0.25 && param > 0.45
      ? '温めると液のねばりが下がり、上の層だけが滑りやすくなっています（試験管の実験をもとにした表現で、体の中では確かめられていません）。'
      : effLevel === 2
        ? '⚠ 液がドロドロで、上の層を動かすと下の層や筋肉まで引きずられます。これが Stecco らの言う「高密度化」のイメージです。'
        : effLevel === 1
          ? '○ 液が少しとろっとして、下の層も少し引きずられます。'
          : '◎ 液がサラサラで、上の層だけがスッと滑ります。'
    : level === 2
      ? '△ ネットがゆるみ、皮膚が大きくずれて、離したあと戻るのが遅くなっています。'
      : level === 1
        ? '○ 弾力は中くらい。離したあと、戻るのが少しゆっくりになります。'
        : '◎ ネットに弾力があり、皮膚を動かしても、離すとすぐに戻ります。';
  const tone = deep ? (effLevel === 0 || (warmth > 0.25 && param > 0.45) ? 'good' : effLevel === 2 ? 'bad' : '') : level === 0 ? 'good' : level === 2 ? 'bad' : '';

  return (
    <div className="fascia-grid">
      <div className="fascia-stage-2d">
        <div className="fascia-hint-3d">
          <span className={auto ? '' : 'fascia-hint-pulse'}>{deep ? '← 深筋膜の上の層を左右にドラッグ →' : '← 皮膚を左右にドラッグ →'}</span>
        </div>
        <div
          className={`fascia-zoom ${dragging ? 'dragging' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <ZoomView deep={deep} off={off} loose={deep ? 0 : param} visc={visc} />
        </div>
      </div>

      <div className="iap-controls">
        <button className={`fascia-demo-btn ${auto ? 'playing' : ''}`} onClick={play} disabled={auto}>
          {auto ? '動かしています…' : '▶ まず見る（自動で動かして離す）'}
        </button>

        <label className="slider-row">
          <span className="slider-name" style={{ color: deep ? '#C0562F' : '#5f9a66' }}>
            {deep ? '層の間の液' : '浅筋膜の弾力'}
          </span>
          <input type="range" min="0" max="1" step="0.01" value={param} disabled={auto} onChange={(e) => setParam(+e.target.value)} aria-label={deep ? '層の間の液（サラサラ〜ドロドロ）' : '浅筋膜の弾力（しっかり〜ゆるい）'} />
          <span className="slider-val">{paramWord}</span>
        </label>

        {deep && (
          <button
            className="load-btn warm"
            disabled={auto}
            onPointerDown={() => (warming.current = true)}
            onPointerUp={() => (warming.current = false)}
            onPointerLeave={() => (warming.current = false)}
          >
            長押しで「動かして温める」🔥 {warmth > 0.02 ? `(+${Math.round(warmth * 100)}%)` : ''}
          </button>
        )}

        <div className="iap-gauges">
          <Gauge value={g1.value} label={g1.label} display={g1.word} color={deep && visc > 0.5 ? '#C0562F' : '#86B98C'} />
          <Gauge value={g2.value} label={g2.label} display={g2.word} color="#5E8BA8" />
        </div>

        <div className={`iap-verdict ${tone}`}>{verdict}</div>

        <div className="fascia-note">
          {deep ? (
            <>
              <b>深筋膜</b>は、筋肉を包む丈夫な膜で、何枚かの層が重なっています。層の間には<b>ヒアルロン酸</b>を含む液があり、層どうしが滑るのを助けています。この液がねばって滑りが悪くなった状態を、Stecco らは<b>高密度化</b>と呼びます（傷あとの「癒着」とは別のものです）。
            </>
          ) : (
            <>
              <b>浅筋膜</b>は、皮下脂肪の中にある、伸び縮みするネットのような膜です。細い線維（図の縦の線）で皮膚や深い層とつながり、皮膚が動いたあとに元へ戻す役目をしています。
            </>
          )}
        </div>

        <div className="fascia-try">
          <span>TRY</span>
          <b>自分の体で試す</b>
          <p>
            {deep
              ? '片手を反対の前腕に軽く当てたまま、指を握ったり開いたりしてみてください。皮膚はほとんど動かないのに、その下で筋肉が滑るように動くのがわかります。層どうしが滑っているからです。'
              : '手の甲の皮膚を指でつまんで、左右に動かしてみてください。皮膚だけがずれて、離すと元に戻ります。これが浅い層の滑りと、浅筋膜の戻る力です。'}
          </p>
        </div>
      </div>
    </div>
  );
}

type Off = Record<'skin' | 'fatUp' | 'sf' | 'fatLow' | 'dfA' | 'dfB' | 'muscle', number>;

/** 拡大図。動かす層に合わせて各層をずらし、層をつなぐ線や液の糸を傾けて「引っぱられ方」を見せる */
function ZoomView({ deep, off, loose, visc }: { deep: boolean; off: Off; loose: number; visc: number }) {
  const xs = Array.from({ length: 9 }, (_, i) => X0 + 14 + i * 26);
  const dimUpper = deep ? 0.4 : 1;
  const dimLower = deep ? 1 : 0.45;
  const liqColor = mix('#9fd6ee', '#e3a23c', visc);
  const liqWord = visc < 0.34 ? 'サラサラ' : visc < 0.67 ? 'とろっと' : 'ドロドロ';
  const sag = 1 + loose * 5; // ゆるいほど、ネットがたるんで波打つ

  // 浅筋膜（ネット）の波線
  const sfPath = (() => {
    let d = '';
    for (let x = X0 - 30; x <= X1 + 30; x += 4) {
      const y = L.sf.y + L.sf.h / 2 + Math.sin((x - off.sf) / 9) * sag;
      d += `${d ? 'L' : 'M'}${(x + off.sf).toFixed(1)} ${y.toFixed(1)} `;
    }
    return d;
  })();

  const layerLabels: { text: string; y: number; on: boolean }[] = [
    { text: '皮膚', y: L.skin.y + L.skin.h / 2, on: false },
    { text: '皮下脂肪', y: L.fatUp.y + L.fatUp.h / 2, on: false },
    { text: '浅筋膜', y: L.sf.y + L.sf.h / 2, on: !deep },
    { text: '皮下脂肪', y: L.fatLow.y + L.fatLow.h / 2, on: false },
    { text: '深筋膜の層', y: L.dfA.y + L.dfA.h / 2, on: deep },
    { text: '層の間の液', y: L.liq.y + L.liq.h / 2 + 1, on: deep },
    { text: '深筋膜の層', y: L.dfB.y + L.dfB.h / 2 + 2, on: deep },
    { text: '筋肉', y: L.muscle.y + L.muscle.h / 2, on: false },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={deep ? '深筋膜の拡大図。2枚の層の間に液がある' : '浅筋膜の拡大図。皮膚と皮下脂肪の中のネット'}>
      <defs>
        <clipPath id="fz-clip">
          <rect x={X0} y="0" width={X1 - X0} height={H} rx="10" />
        </clipPath>
      </defs>
      <g clipPath="url(#fz-clip)">
        {/* 皮膚・皮下脂肪・浅筋膜 */}
        <g opacity={dimUpper}>
          <rect x={X0 - 60 + off.skin} y={L.skin.y} width={X1 - X0 + 120} height={L.skin.h} fill={C.skin} />
          <rect x={X0 - 60 + off.fatUp} y={L.fatUp.y} width={X1 - X0 + 120} height={L.fatUp.h} fill={C.fat} />
          <rect x={X0 - 60 + off.fatLow} y={L.fatLow.y} width={X1 - X0 + 120} height={L.fatLow.h} fill={C.fat} />
          {xs.map((x, i) => (
            <g key={i}>
              <circle cx={x + 13 + off.fatUp} cy={L.fatUp.y + 12 + (i % 2) * 14} r="7" fill={C.fatDot} />
              <circle cx={x + off.fatLow} cy={L.fatLow.y + 15} r="7.5" fill={C.fatDot} />
            </g>
          ))}
          {/* 皮膚・浅筋膜・深筋膜をつなぐ細い線維（皮膚が動くと傾く） */}
          {xs.map((x, i) => (
            <g key={`r${i}`} stroke="#8a6f45" strokeWidth="1.3" opacity="0.8">
              <line x1={x + off.skin} y1={L.skin.y + L.skin.h} x2={x + off.sf} y2={L.sf.y} />
              <line x1={x + off.sf} y1={L.sf.y + L.sf.h} x2={x + off.dfA} y2={L.dfA.y} />
            </g>
          ))}
          <path d={sfPath} fill="none" stroke={deep ? C.sf : C.sf} strokeWidth={deep ? 3 : 4.5} strokeLinecap="round" />
        </g>

        {/* 深筋膜（2枚の層と、その間の液）・筋肉 */}
        <g opacity={dimLower}>
          <rect x={X0 - 60 + off.dfA} y={L.dfA.y} width={X1 - X0 + 120} height={L.dfA.h} fill={C.df} />
          {Array.from({ length: 16 }, (_, i) => X0 - 40 + i * 18).map((x) => (
            <line key={`a${x}`} x1={x + off.dfA} y1={L.dfA.y + 2} x2={x + 10 + off.dfA} y2={L.dfA.y + L.dfA.h - 2} stroke={C.thin} strokeWidth="1.2" />
          ))}
          <rect x={X0} y={L.liq.y} width={X1 - X0} height={L.liq.h} fill={liqColor} opacity={0.35 + visc * 0.5} />
          {/* 液の糸。ねばるほど太く濃くなり、上下の層のずれで斜めに引きのばされる */}
          {Array.from({ length: 15 }, (_, i) => X0 + 8 + i * 15.5).map((x) => (
            <line
              key={`q${x}`}
              x1={x + off.dfA}
              y1={L.liq.y}
              x2={x + off.dfB}
              y2={L.liq.y + L.liq.h}
              stroke={liqColor}
              strokeWidth={0.6 + visc * 3}
              opacity={deep ? 0.25 + visc * 0.7 : 0.4}
            />
          ))}
          <rect x={X0 - 60 + off.dfB} y={L.dfB.y} width={X1 - X0 + 120} height={L.dfB.h} fill={C.df} />
          {Array.from({ length: 16 }, (_, i) => X0 - 40 + i * 18).map((x) => (
            <line key={`b${x}`} x1={x + 10 + off.dfB} y1={L.dfB.y + 2} x2={x + off.dfB} y2={L.dfB.y + L.dfB.h - 2} stroke={C.thin} strokeWidth="1.2" />
          ))}
          <rect x={X0 - 60 + off.muscle} y={L.muscle.y} width={X1 - X0 + 120} height={L.muscle.h} fill={C.muscle} />
          {Array.from({ length: 7 }, (_, i) => L.muscle.y + 9 + i * 10).map((y) => (
            <line key={`m${y}`} x1={X0 - 60 + off.muscle} y1={y} x2={X1 + 60 + off.muscle} y2={y} stroke={C.muscleLine} strokeWidth="2" />
          ))}
          {deep && (
            <text x={X0 + 34} y={L.liq.y + L.liq.h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#1b1b17" opacity="0.75">
              {liqWord}
            </text>
          )}
        </g>
        {/* 目印: 点線＝動かす前の位置、白い棒＝いまの各層の位置。棒のずれ方で、どの層がどれだけ動いたかがわかる */}
        <line x1={MID} y1={L.skin.y - 6} x2={MID} y2={L.muscle.y + L.muscle.h} stroke="#efeadc" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.7" />
        {(
          [
            ['skin', L.skin],
            ['fatUp', L.fatUp],
            ['fatLow', L.fatLow],
            ['dfA', L.dfA],
            ['dfB', L.dfB],
            ['muscle', L.muscle],
          ] as const
        ).map(([k, l]) => (
          <rect key={k} x={MID - 2.5 + off[k]} y={l.y + 2} width="5" height={Math.min(l.h - 4, 22)} rx="2" fill="#fffaf0" stroke="#1b1b17" strokeWidth="0.8" />
        ))}
      </g>

      {/* 層の名前 */}
      {layerLabels.map((l, i) => (
        <g key={i}>
          <line x1={X1 + 4} y1={l.y} x2={X1 + 12} y2={l.y} stroke={l.on ? C.active : C.muted} strokeWidth="1" />
          <text x={X1 + 16} y={l.y + 4} fontSize="11.5" fontWeight={l.on ? 900 : 700} fill={l.on ? '#f0915f' : C.muted}>
            {l.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* =============== 共有:円ゲージ =============== */

function Gauge({ value, label, display, color }: { value: number; label: string; display: string; color: string }) {
  const circ = 2 * Math.PI * 52;
  const v = clamp(value, 0, 1);
  return (
    <div className="gauge">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - v)}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="62" textAnchor="middle" className={display.length > 4 ? 'gauge-word gauge-word-sm' : 'gauge-word'} fill="#1B1B17">
          {display}
        </text>
        <text x="60" y="80" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
          目安
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}
