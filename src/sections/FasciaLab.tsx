import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SuperficialFasciaModel3D, DeepFasciaModel3D } from '../three/FasciaModels';

/**
 * FASCIA LAB — 筋膜スキャナー(3D)
 * パドヴァ大学 Stecco らの筋膜解剖学(Fascial Manipulation)を参考に、
 * 浅筋膜(弾性・皮膚滑走)と深筋膜(層間のヒアルロン酸滑走・高密度化)を
 * 積層した立体断面として体験する。
 *
 * 「まず見る → 次に触る」の2段階構成:
 *   1. ワンクリックで「健康な状態」と「弱った状態」の自動デモを見せる
 *   2. デモが終わったら、自分の指でドラッグ・スライダーを操作して確かめる
 *
 * ドラッグの受け取り自体はDOM側(Canvasに重ねた透明なオーバーレイ)で行い、
 * 3D描画は src/three/FasciaModels.tsx に分離している。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/** 0→1 で「すっと伸びて、指定の速さで戻る」動きを作る(riseFracまでに立ち上がり、その後decayRateで減衰) */
function slideBack(t: number, riseFrac: number, decayRate: number, floor = 0) {
  const ct = clamp(t, 0, 1);
  if (ct < riseFrac) return easeOut(ct / riseFrac);
  const dt = (ct - riseFrac) / (1 - riseFrac);
  return Math.max(floor, Math.exp(-dt * decayRate));
}

type Mode = 'superficial' | 'deep';
type Tone = 'good' | 'bad' | '';
type Caption = { text: string; tone: Tone };

export function FasciaLab() {
  const [mode, setMode] = useState<Mode>('superficial');
  return (
    <section id="fascia" className="section">
      <div className="section-head">
        <span className="section-index">04 / FASCIA LAYERS</span>
        <h2>
          FASCIA LAB<span className="jp-sub">筋膜スキャナー</span>
        </h2>
        <p className="section-lead">
          筋膜は筋肉を包むだけでなく、身体各部の張力をつなぎ、動きの調整に関わる連続した組織です。ここでは浅筋膜と深筋膜を分け、まず<b>「▶ まず見る」</b>で構造の違いを確認し、その後に立体モデルを動かして“滑走”と“戻り”を比べます。
        </p>
      </div>

      <div className="fascia-principles">
        <div><span>01</span><b>局所だけで見ない</b><p>痛む場所と、動きが乱れる原因候補は同じとは限りません。</p></div>
        <div><span>02</span><b>動きの連続性を見る</b><p>筋膜を、身体各部の張力と運動をつなぐシステムとして捉えます。</p></div>
        <div><span>03</span><b>高密度化を評価する</b><p>運動検査と触診を組み合わせ、滑走抵抗が疑われる点を絞ります。</p></div>
      </div>

      <div className="neuro-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'superficial'} className={mode === 'superficial' ? 'tab-active' : ''} onClick={() => setMode('superficial')}>
          浅筋膜<span>SUPERFICIAL FASCIA</span>
        </button>
        <button role="tab" aria-selected={mode === 'deep'} className={mode === 'deep' ? 'tab-active' : ''} onClick={() => setMode('deep')}>
          深筋膜<span>DEEP FASCIA</span>
        </button>
      </div>

      {mode === 'superficial' ? <SuperficialLab /> : <DeepLab />}

      <p className="neuro-caution">
        参考: Fascial Manipulation® Institute by Stecco の方法論、およびC. &amp; A. Steccoらの筋膜解剖研究。本コンテンツは概念を体感する教育用モデルで、触診・評価・治療を再現するものではありません。
      </p>
    </section>
  );
}

/* =============== 浅筋膜:弾性と皮膚滑走 =============== */

const SF_DEMO_DURATION = 7.6;

function runSuperficialDemo(
  t: number,
  setElast: (v: number) => void,
  setDisp: (v: number) => void,
  setCaption: (c: Caption) => void,
  onDone: () => void,
) {
  const maxDFor = (e: number) => 0.65 + (1 - e) * 0.5;

  if (t < 2.0) {
    const e = 0.85;
    setElast(e);
    setDisp(maxDFor(e) * slideBack(t / 2.0, 0.18, 5.5));
    setCaption({ text: '◎ 滑走しやすい状態：皮膚と皮下組織が動き、離すと戻ります。', tone: 'good' });
  } else if (t < 2.8) {
    const lt = easeOut((t - 2.0) / 0.8);
    setElast(lerp(0.85, 0.12, lt));
    setDisp(0);
    setCaption({ text: '組織の状態によって、滑りや戻り方には違いが生じます…', tone: '' });
  } else if (t < 5.3) {
    const e = 0.12;
    setElast(e);
    const lt = (t - 2.8) / 2.5;
    setDisp(maxDFor(e) * slideBack(lt, 0.1, 0.8, 0.18));
    setCaption({ text: '△ 滑走しにくい状態：同じ力でも移動量が変わり、戻りが遅くなります。', tone: 'bad' });
  } else if (t < 6.0) {
    const lt = easeOut((t - 5.3) / 0.7);
    setElast(lerp(0.12, 0.72, lt));
    setDisp(lerp(maxDFor(0.12) * 0.18, 0, lt));
    setCaption({ text: 'このモデルでは、組織状態による動きの違いを単純化しています。', tone: '' });
  } else if (t < SF_DEMO_DURATION) {
    setElast(0.72);
    setDisp(0);
    setCaption({ text: '👆 では、下のスライダーとドラッグで自分の指で確かめてみましょう。', tone: '' });
  } else {
    onDone();
  }
}

function SuperficialLab() {
  const [elast, setElast] = useState(0.72); // 弾性線維・水分の量
  const [disp, setDisp] = useState(0); // 正規化した皮膚のずれ
  const [demoPhase, setDemoPhase] = useState<'idle' | 'playing'>('idle');
  const [demoCaption, setDemoCaption] = useState<Caption>({ text: '', tone: '' });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startDisp = useRef(0);
  const dispRef = useRef(0);
  const elastRef = useRef(elast);
  const demoPhaseRef = useRef(demoPhase);
  const demoStart = useRef(0);
  dispRef.current = disp;
  elastRef.current = elast;
  demoPhaseRef.current = demoPhase;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (demoPhaseRef.current === 'playing') {
        const t = (performance.now() - demoStart.current) / 1000;
        runSuperficialDemo(t, setElast, setDisp, setDemoCaption, () => setDemoPhase('idle'));
      } else if (!dragging.current) {
        // 弾性が高いほど速く元に戻る(弾性回復)
        const decay = 0.015 + elastRef.current * 0.17;
        const next = dispRef.current * (1 - decay);
        setDisp(Math.abs(next) < 0.001 ? 0 : next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const maxD = 0.65 + (1 - elast) * 0.5; // 弾性が低い(緩い)ほど大きくずれる
  const playing = demoPhase === 'playing';

  const startDemo = () => {
    demoStart.current = performance.now();
    setDemoCaption({ text: '', tone: '' });
    setDemoPhase('playing');
  };
  const stopDemo = () => setDemoPhase('idle');

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (playing) return;
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    startDisp.current = dispRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = (e.clientX - startX.current) / 150;
    setDisp(clamp(startDisp.current + dx, -maxD, maxD));
  };
  const onUp = () => {
    dragging.current = false;
    setIsDragging(false);
  };

  const stretchPct = Math.round((Math.abs(disp) / maxD) * 100);
  const recoilPct = Math.round(elast * 100);

  const verdict =
    elast > 0.66
      ? '◎ このモデルでは滑走しやすく、皮膚を離すと速やかに戻る状態です。'
      : elast > 0.33
        ? '○ 滑走と戻りは中程度です。値を変えて、同じドラッグでも反応が変わることを確認してください。'
        : '△ このモデルでは滑走抵抗が大きく、皮膚を離した後の戻りが遅い状態です。';

  // 3D空間でのオフセット量(SVG時代のピクセル値を3D単位にスケール)
  const skinShift3d = disp * 2.4;
  const sfShift3d = skinShift3d * 0.55;

  return (
    <div className="fascia-grid">
      <div className="fascia-stage-3d">
        <Canvas camera={{ position: [3.2, 0.9, 15.5], fov: 30 }} dpr={[1, 2]}>
          <ambientLight intensity={0.72} />
          <directionalLight position={[3, 5, 5]} intensity={1.1} />
          <pointLight position={[-5, -1, 4]} color="#5E8BA8" intensity={22} />
          <group rotation={[0, -0.22, 0]}>
            <Suspense fallback={null}>
              <SuperficialFasciaModel3D skinShift={skinShift3d} sfShift={sfShift3d} laxity={1 - elast} />
            </Suspense>
          </group>
        </Canvas>
        <div className="fascia-hint-3d">
          <span className={playing ? '' : 'fascia-hint-pulse'}>{playing ? 'オートデモ再生中…' : '← 皮膚(いちばん上の層)を左右にドラッグ →'}</span>
        </div>
        <div
          className={`fascia-drag-overlay ${playing ? 'no-drag' : isDragging ? 'dragging' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      <div className="iap-controls">
        <button className={`fascia-demo-btn ${playing ? 'playing' : ''}`} onClick={playing ? stopDemo : startDemo}>
          {playing ? '■ デモ再生中…（クリックで止める）' : '▶ まず見る：健康な浅筋膜 vs 弱った浅筋膜'}
        </button>

        <div className="iap-gauges">
          <Gauge value={elast} label="弾性(戻る力)" display={`${recoilPct}`} unit="%" color="#86B98C" />
          <Gauge value={Math.abs(disp) / maxD} label="皮膚の滑走" display={`${stretchPct}`} unit="%" color="#5E8BA8" />
        </div>

        <label className="slider-row">
          <span className="slider-name" style={{ color: '#86B98C' }}>
            弾性・水分
          </span>
          <input type="range" min="0" max="1" step="0.01" value={elast} disabled={playing} onChange={(e) => setElast(+e.target.value)} />
          <span className="slider-val">{recoilPct}%</span>
        </label>

        <div className="fascia-note">
          <b>浅筋膜</b>は皮下の膜様層。弾性線維に富み、皮膚支帯(retinacula
          cutis)で皮膚と深部をつなぎます。このモデルでは、皮膚と皮下組織の相対的な滑りと弾性回復に注目します。スライダーは特定の病態ではなく、組織状態の違いを抽象化したものです。
        </div>

        {playing ? (
          <div className={`fascia-demo-caption ${demoCaption.tone}`}>
            <span className="demo-tag">AUTO DEMO</span>
            <span>{demoCaption.text}</span>
          </div>
        ) : (
          <div className={`iap-verdict ${elast > 0.66 ? 'good' : elast <= 0.33 ? 'bad' : ''}`}>{verdict}</div>
        )}
      </div>
    </div>
  );
}

/* =============== 深筋膜:層間の滑走と高密度化 =============== */

const DEEP_DEMO_DURATION = 8.8;

function runDeepDemo(
  t: number,
  setDens: (v: number) => void,
  setWarmth: (v: number) => void,
  setSlide: (v: number) => void,
  setCaption: (c: Caption) => void,
  onDone: () => void,
) {
  if (t < 2.2) {
    setDens(0.15);
    setWarmth(0);
    setSlide(Math.sin((t / 2.2) * Math.PI * 1.4) * 0.9);
    setCaption({ text: '◎ 滑走抵抗が小さく、コラーゲン層が相対的に動きます。', tone: 'good' });
  } else if (t < 3.0) {
    const lt = easeOut((t - 2.2) / 0.8);
    setDens(lerp(0.15, 0.85, lt));
    setWarmth(0);
    setSlide(lerp(0.9 * Math.sin(1.4 * Math.PI), 0, lt));
    setCaption({ text: 'ヒアルロン酸を含む層の粘性が変化すると、滑走抵抗が増え…', tone: '' });
  } else if (t < 5.5) {
    setDens(0.85);
    setWarmth(0);
    const lt = (t - 3.0) / 2.5;
    setSlide(Math.sin(lt * Math.PI * 1.2) * 0.22);
    setCaption({ text: '⚠ 高密度化(densification)：層間の滑走抵抗が増え、動きの調整が難しくなります。', tone: 'bad' });
  } else if (t < 6.5) {
    const lt = (t - 5.5) / 1.0;
    setDens(0.85);
    setWarmth(easeOut(lt));
    setSlide(Math.sin(lt * Math.PI * 1.6) * 0.7);
    setCaption({ text: '🔥 動かして温めると、一時的に滑走性が回復します。', tone: 'good' });
  } else if (t < 7.3) {
    const lt = easeOut((t - 6.5) / 0.8);
    setDens(lerp(0.85, 0.62, lt));
    setWarmth(lerp(1, 0, lt));
    setSlide(0);
    setCaption({ text: '元の状態に戻します…', tone: '' });
  } else if (t < DEEP_DEMO_DURATION) {
    setDens(0.62);
    setWarmth(0);
    setSlide(0);
    setCaption({ text: '👆 では、表層をドラッグしたり、長押しで「温める」を試してみましょう。', tone: '' });
  } else {
    onDone();
  }
}

function DeepLab() {
  const [dens, setDens] = useState(0.62); // 高密度化(HA粘度)のベースライン
  const [warmth, setWarmth] = useState(0); // 運動・熱による一時的な粘度低下
  const [slide, setSlide] = useState(0); // 層間の正規化せん断量
  const [demoPhase, setDemoPhase] = useState<'idle' | 'playing'>('idle');
  const [demoCaption, setDemoCaption] = useState<Caption>({ text: '', tone: '' });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const warming = useRef(false);
  const startX = useRef(0);
  const startSlide = useRef(0);
  const slideRef = useRef(0);
  const densRef = useRef(dens);
  const warmthRef = useRef(warmth);
  const demoPhaseRef = useRef(demoPhase);
  const demoStart = useRef(0);
  slideRef.current = slide;
  densRef.current = dens;
  warmthRef.current = warmth;
  demoPhaseRef.current = demoPhase;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (demoPhaseRef.current === 'playing') {
        const t = (performance.now() - demoStart.current) / 1000;
        runDeepDemo(t, setDens, setWarmth, setSlide, setDemoCaption, () => setDemoPhase('idle'));
      } else {
        // ウォームアップ:押している間は上昇、離すと減衰(効果は一時的)
        setWarmth((w) => {
          const target = warming.current ? 1 : 0;
          const rate = warming.current ? 0.035 : 0.01;
          const nw = lerp(w, target, rate);
          return Math.abs(nw - target) < 0.004 ? target : nw;
        });
        if (!dragging.current) {
          setSlide((s) => (Math.abs(s) < 0.002 ? 0 : s * 0.9));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const visc = Math.max(0.05, dens * (1 - 0.78 * warmth)); // 実効的なHA粘度
  const glide = 1 - visc; // 滑走性 0..1
  const glidePct = Math.round(glide * 100);
  const romPct = Math.round(45 + glide * 55);
  const playing = demoPhase === 'playing';

  const startDemo = () => {
    demoStart.current = performance.now();
    setDemoCaption({ text: '', tone: '' });
    setDemoPhase('playing');
  };
  const stopDemo = () => setDemoPhase('idle');

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (playing) return;
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    startSlide.current = slideRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const gain = 1 / (1 + visc * 4); // 粘度が高いほど滑りにくい
    const dx = ((e.clientX - startX.current) / 150) * gain;
    setSlide(clamp(startSlide.current + dx, -1, 1));
  };
  const onUp = () => {
    dragging.current = false;
    setIsDragging(false);
  };

  const verdict = warmth > 0.25 && dens > 0.45
    ? 'このモデルでは温度上昇により粘性が下がり、層間の滑走抵抗が一時的に小さくなっています。'
    : visc > 0.5
      ? '⚠ 高密度化(densification)を想定した状態です。癒着そのものではなく、ヒアルロン酸を含む層の粘性変化による滑走抵抗を表現しています。'
      : glide > 0.7
        ? '◎ このモデルでは層間の滑走抵抗が小さく、相対運動が起こりやすい状態です。'
        : '○ 滑走抵抗は中程度です。高密度化と温度の値を変え、層の動き方を比較してください。';

  // 3D空間でのオフセット量・見た目パラメータ
  const l1Shift3d = slide * 1.9;
  const l2Shift3d = l1Shift3d * visc;
  const haColor = `rgb(${Math.round(lerp(91, 255, visc))}, ${Math.round(lerp(140, 90, visc))}, ${Math.round(lerp(255, 80, visc))})`;
  const haThickness = 0.1 + visc * 0.16;

  return (
    <div className="fascia-grid">
      <div className="fascia-stage-3d">
        <Canvas camera={{ position: [3.2, 0.6, 17.5], fov: 30 }} dpr={[1, 2]}>
          <ambientLight intensity={0.72} />
          <directionalLight position={[3, 5, 5]} intensity={1.1} />
          <pointLight position={[-5, -1, 4]} color="#C0562F" intensity={18} />
          <group rotation={[0, -0.22, 0]}>
            <Suspense fallback={null}>
              <DeepFasciaModel3D l1Shift={l1Shift3d} l2Shift={l2Shift3d} haColor={haColor} haThickness={haThickness} />
            </Suspense>
          </group>
        </Canvas>
        <div className="fascia-hint-3d">
          <span className={playing ? '' : 'fascia-hint-pulse'}>{playing ? 'オートデモ再生中…' : '← 表層(いちばん上のコラーゲン層)を左右にドラッグ →'}</span>
        </div>
        <div
          className={`fascia-drag-overlay ${playing ? 'no-drag' : isDragging ? 'dragging' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>

      <div className="iap-controls">
        <button className={`fascia-demo-btn ${playing ? 'playing' : ''}`} onClick={playing ? stopDemo : startDemo}>
          {playing ? '■ デモ再生中…（クリックで止める）' : '▶ まず見る：滑らかな深筋膜 vs 高密度化した深筋膜'}
        </button>

        <div className="iap-gauges">
          <Gauge value={glide} label="層間の滑走性" display={`${glidePct}`} unit="%" color={visc > 0.5 ? '#C0562F' : '#86B98C'} />
          <Gauge value={romPct / 100} label="可動域(ROM)" display={`${romPct}`} unit="%" color="#5E8BA8" />
        </div>

        <label className="slider-row">
          <span className="slider-name" style={{ color: '#C0562F' }}>
            高密度化
          </span>
          <input type="range" min="0" max="1" step="0.01" value={dens} disabled={playing} onChange={(e) => setDens(+e.target.value)} />
          <span className="slider-val">{Math.round(dens * 100)}%</span>
        </label>

        <button
          className="load-btn warm"
          disabled={playing}
          onPointerDown={() => (warming.current = true)}
          onPointerUp={() => (warming.current = false)}
          onPointerLeave={() => (warming.current = false)}
        >
          長押しで「動かして温める」🔥 {warmth > 0.02 ? `(+${Math.round(warmth * 100)}%)` : ''}
        </button>

        <div className="fascia-note">
          <b>深筋膜</b>は異なる方向のコラーゲン線維層と、<b>ヒアルロン酸</b>を含む疎性結合組織から構成されます。Stecco法では、粘性の変化によって滑走抵抗が増した状態を<b>高密度化(densification)</b>として評価します。これは瘢痕性の「癒着」と同義ではありません。
        </div>

        {playing ? (
          <div className={`fascia-demo-caption ${demoCaption.tone}`}>
            <span className="demo-tag">AUTO DEMO</span>
            <span>{demoCaption.text}</span>
          </div>
        ) : (
          <div className={`iap-verdict ${glide > 0.7 && visc <= 0.5 ? 'good' : visc > 0.5 && warmth <= 0.25 ? 'bad' : ''}`}>{verdict}</div>
        )}
      </div>
    </div>
  );
}

/* =============== 共有:円ゲージ =============== */

function Gauge({ value, label, display, unit, color }: { value: number; label: string; display: string; unit: string; color: string }) {
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
        <text x="60" y="56" textAnchor="middle" className="gauge-num" fill="#1B1B17">
          {display}
        </text>
        <text x="60" y="76" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
          {unit}
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}
