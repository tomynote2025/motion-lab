import { useEffect, useRef, useState } from 'react';

/**
 * FASCIA LAB — 筋膜スキャナー
 * パドヴァ大学 Stecco らの筋膜解剖学(Fascial Manipulation)を参考に、
 * 浅筋膜(弾性・皮膚滑走)と深筋膜(層間のヒアルロン酸滑走・高密度化)を体験する。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Mode = 'superficial' | 'deep';

export function FasciaLab() {
  const [mode, setMode] = useState<Mode>('superficial');
  return (
    <section id="fascia" className="section">
      <div className="section-head">
        <span className="section-index">04</span>
        <h2>
          FASCIA LAB<span className="jp-sub">筋膜スキャナー</span>
        </h2>
        <p className="section-lead">
          筋膜は「硬い/柔らかい」だけでは語れません。皮膚を滑らせる浅筋膜と、層の間をヒアルロン酸で滑走する深筋膜 —
          2つの膜をドラッグして、それぞれの“滑り”と“戻り”を確かめてください。
        </p>
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
        参考: C. &amp; A. Stecco ら(パドヴァ大学)の筋膜解剖研究。本コンテンツは概念を体感するための教育用モデルであり、実際の組織挙動を厳密に再現するものではありません。
      </p>
    </section>
  );
}

/* =============== 浅筋膜:弾性と皮膚滑走 =============== */

function SuperficialLab() {
  const [elast, setElast] = useState(0.72); // 弾性線維・水分の量
  const [disp, setDisp] = useState(0); // 正規化した皮膚のずれ
  const dragging = useRef(false);
  const startX = useRef(0);
  const startDisp = useRef(0);
  const dispRef = useRef(0);
  const elastRef = useRef(elast);
  dispRef.current = disp;
  elastRef.current = elast;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (!dragging.current) {
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

  const onDown = (e: React.PointerEvent<SVGRectElement>) => {
    dragging.current = true;
    startX.current = e.clientX;
    startDisp.current = dispRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!dragging.current) return;
    const dx = (e.clientX - startX.current) / 150;
    setDisp(clamp(startDisp.current + dx, -maxD, maxD));
  };
  const onUp = () => {
    dragging.current = false;
  };

  const skinPx = disp * 62;
  const sfPx = skinPx * 0.55; // 浅筋膜は弾性で皮膚に一部追従
  const stretchPct = Math.round((Math.abs(disp) / maxD) * 100);
  const recoilPct = Math.round(elast * 100);

  // 皮膚支帯(retinacula cutis)— 上端は皮膚、下端は膜に付着してせん断する
  const anchors = [70, 150, 235, 320, 400];

  const verdict =
    elast > 0.66
      ? '◎ 水分と弾性線維が豊富。皮膚がよく滑り、離すとしっかり戻る健康な浅筋膜です。'
      : elast > 0.33
        ? '○ ふつう。乾燥・運動不足が続くと弾性線維が減り、戻りが鈍くなっていきます。'
        : '△ 弾性の低下(加齢・脱水・不動)。皮膚がたるんで戻りが遅く、むくみ・冷え・こりの土台になります。';

  return (
    <div className="fascia-grid">
      <div className="iap-stage">
        <svg viewBox="0 0 470 340" className="iap-svg fascia-drag" role="img" aria-label="浅筋膜の断面モデル">
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8c9a8" />
              <stop offset="100%" stopColor="#c99b73" />
            </linearGradient>
          </defs>

          {/* 深筋膜(固定の土台) */}
          <rect x="20" y="288" width="430" height="26" rx="6" fill="#22402F" />
          <text x="30" y="305" className="iap-label" fill="#7E8F84" fontSize="12">
            深筋膜(土台)
          </text>

          {/* 深脂肪層(DAT)+ 皮膚支帯 深層 */}
          <rect x="20" y="212" width="430" height="70" rx="8" fill="#2a2118" opacity="0.65" />
          {anchors.map((x, i) => (
            <line key={`p${i}`} x1={x + sfPx} y1="204" x2={x} y2="286" stroke="#6f5a3f" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          {[60, 150, 250, 350, 420].map((x, i) => (
            <circle key={`dat${i}`} cx={x} cy="248" r="15" fill="#3a2c1e" opacity="0.7" />
          ))}

          {/* 浅筋膜(膜様層)— 弾性で波打ち、皮膚に一部追従 */}
          <path
            d={sfMembrane(sfPx, 1 - elast)}
            fill="none"
            stroke="#86B98C"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <text x={30 + sfPx} y="188" className="iap-label" fill="#86B98C">
            浅筋膜
          </text>

          {/* 浅脂肪層(SAT)+ 皮膚支帯 浅層 */}
          <rect x="20" y="96" width="430" height="82" rx="8" fill="#3a2c1e" opacity="0.55" />
          {anchors.map((x, i) => (
            <line key={`s${i}`} x1={x + skinPx} y1="94" x2={x + sfPx} y2="176" stroke="#8a6f4d" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          {[70, 175, 285, 390].map((x, i) => (
            <circle key={`sat${i}`} cx={x + skinPx * 0.6} cy="132" r="18" fill="#4a3722" opacity="0.75" />
          ))}
          <text x="30" y="120" className="iap-label" fill="#7E8F84" fontSize="12">
            皮下脂肪・皮膚支帯
          </text>

          {/* 皮膚(ドラッグ対象) */}
          <g style={{ transform: `translateX(${skinPx}px)`, transition: dragging.current ? 'none' : 'transform 0.05s' }}>
            <rect x="20" y="44" width="430" height="50" rx="10" fill="url(#skinGrad)" />
            <rect x="20" y="44" width="430" height="10" rx="5" fill="#f2ddc4" opacity="0.5" />
            <text x="235" y="74" textAnchor="middle" fontSize="14" fontWeight="700" fill="#5a3d22">
              皮膚
            </text>
          </g>

          <text x="235" y="28" textAnchor="middle" className="fascia-hint-svg" fill="#7E8F84">
            ← 皮膚を左右にドラッグ →
          </text>

          {/* ドラッグ面 */}
          <rect
            x="0"
            y="40"
            width="470"
            height="150"
            fill="transparent"
            style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </svg>
      </div>

      <div className="iap-controls">
        <div className="iap-gauges">
          <Gauge value={elast} label="弾性(戻る力)" display={`${recoilPct}`} unit="%" color="#86B98C" />
          <Gauge value={Math.abs(disp) / maxD} label="皮膚の滑走" display={`${stretchPct}`} unit="%" color="#5E8BA8" />
        </div>

        <label className="slider-row">
          <span className="slider-name" style={{ color: '#86B98C' }}>
            弾性・水分
          </span>
          <input type="range" min="0" max="1" step="0.01" value={elast} onChange={(e) => setElast(+e.target.value)} />
          <span className="slider-val">{recoilPct}%</span>
        </label>

        <div className="fascia-note">
          <b>浅筋膜</b>は皮下の膜様層。弾性線維に富み、皮膚支帯(retinacula
          cutis)で皮膚と深部をつなぎます。皮膚の滑り・脂肪の区画化・体温調節・リンパの流れを担当。スライダーを下げると加齢・脱水・不動の状態になり、離しても戻りが遅くなります。
        </div>

        <div className={`iap-verdict ${elast > 0.66 ? 'good' : elast <= 0.33 ? 'bad' : ''}`}>{verdict}</div>
      </div>
    </div>
  );
}

function sfMembrane(shift: number, laxity: number) {
  // laxity(=1-elast)が大きいほど波打つ(緩んだ膜)
  const amp = 2 + laxity * 9;
  const y = 176;
  let d = `M ${24 + shift} ${y}`;
  for (let x = 24; x <= 446; x += 28) {
    const yy = y + (Math.round(x / 28) % 2 === 0 ? -amp : amp);
    d += ` L ${x + shift} ${yy}`;
  }
  return d;
}

/* =============== 深筋膜:層間の滑走と高密度化 =============== */

function DeepLab() {
  const [dens, setDens] = useState(0.62); // 高密度化(HA粘度)のベースライン
  const [warmth, setWarmth] = useState(0); // 運動・熱による一時的な粘度低下
  const [slide, setSlide] = useState(0); // 層間の正規化せん断量
  const dragging = useRef(false);
  const warming = useRef(false);
  const startX = useRef(0);
  const startSlide = useRef(0);
  const slideRef = useRef(0);
  const densRef = useRef(dens);
  const warmthRef = useRef(warmth);
  slideRef.current = slide;
  densRef.current = dens;
  warmthRef.current = warmth;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
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
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const visc = Math.max(0.05, dens * (1 - 0.78 * warmth)); // 実効的なHA粘度
  const glide = 1 - visc; // 滑走性 0..1
  const glidePct = Math.round(glide * 100);
  const romPct = Math.round(45 + glide * 55);

  const onDown = (e: React.PointerEvent<SVGRectElement>) => {
    dragging.current = true;
    startX.current = e.clientX;
    startSlide.current = slideRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!dragging.current) return;
    const gain = 1 / (1 + visc * 4); // 粘度が高いほど滑りにくい
    const dx = ((e.clientX - startX.current) / 150) * gain;
    setSlide(clamp(startSlide.current + dx, -1, 1));
  };
  const onUp = () => {
    dragging.current = false;
  };

  const slidePx = slide * 52;
  const l1 = slidePx; // 表層コラーゲン層(ドラッグで動く)
  const l2 = slidePx * visc; // 中間層は粘着して一部追従
  const haColor = `rgb(${Math.round(lerp(91, 255, visc))}, ${Math.round(lerp(140, 90, visc))}, ${Math.round(lerp(255, 80, visc))})`;
  const haH = 6 + visc * 6;

  const verdict = warmth > 0.25 && dens > 0.45
    ? '運動と熱でヒアルロン酸の粘度が低下 — 層の滑走が回復中です(ただし効果は一時的。動かし続けることが大切)。'
    : visc > 0.5
      ? '⚠ 高密度化(densification)。ヒアルロン酸が固まり層が癒着、滑走と可動域が制限。「動かして温める」を長押ししましょう。'
      : glide > 0.7
        ? '◎ 層がなめらかに滑走。力の伝達がスムーズで、固有感覚の入力も最適です。'
        : '○ そこそこ滑走。使いすぎ・不動が続くと粘度が上がり、滑りが落ちていきます。';

  return (
    <div className="fascia-grid">
      <div className="iap-stage">
        <svg viewBox="0 0 470 360" className="iap-svg fascia-drag" role="img" aria-label="深筋膜の層構造モデル">
          <text x="235" y="26" textAnchor="middle" className="fascia-hint-svg" fill="#7E8F84">
            ← 表層を左右にドラッグ →
          </text>

          {/* 疎性結合組織(上) */}
          <rect x="20" y="40" width="430" height="26" rx="6" fill="#14281D" />
          <text x="30" y="57" className="iap-label" fill="#7E8F84" fontSize="11">
            疎性結合組織
          </text>

          {/* コラーゲン層1(表層・ドラッグ対象) */}
          <FasciaLayer y={72} shift={l1} angle={28} label="コラーゲン層 I" />
          {/* ヒアルロン酸 層1 */}
          <rect x="20" y={116 - haH / 2 + 4} width="430" height={haH} rx={haH / 2} fill={haColor} opacity="0.85" />
          {/* コラーゲン層2(中間) */}
          <FasciaLayer y={128} shift={l2} angle={-52} label="コラーゲン層 II" />
          {/* ヒアルロン酸 層2 */}
          <rect x="20" y={172 - haH / 2 + 4} width="430" height={haH} rx={haH / 2} fill={haColor} opacity="0.85" />
          <text x={455} y="182" textAnchor="end" className="iap-label" fill={haColor} fontSize="12">
            ヒアルロン酸層
          </text>
          {/* コラーゲン層3(深層・固定) */}
          <FasciaLayer y={184} shift={0} angle={28} label="コラーゲン層 III" />

          {/* 筋外膜・筋 */}
          <rect x="20" y="232" width="430" height="10" rx="4" fill="#5a2f2a" />
          <rect x="20" y="244" width="430" height="96" rx="10" fill="#3a1f1c" />
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={i} x1={38 + i * 28} y1="248" x2={38 + i * 28} y2="336" stroke="#5a2f2a" strokeWidth="3" />
          ))}
          <text x="30" y="266" className="iap-label" fill="#c98b84" fontSize="12">
            筋(筋外膜)
          </text>

          {/* 層間の滑走インジケータ */}
          <g transform="translate(410, 100)">
            <line x1="0" y1="0" x2={clamp(l1 - l2, -24, 24)} y2="0" stroke="#efeadc" strokeWidth="2" />
            <circle cx={clamp(l1 - l2, -24, 24)} cy="0" r="4" fill="#efeadc" />
          </g>

          {/* ドラッグ面 */}
          <rect
            x="0"
            y="66"
            width="470"
            height="60"
            fill="transparent"
            style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </svg>
      </div>

      <div className="iap-controls">
        <div className="iap-gauges">
          <Gauge value={glide} label="層間の滑走性" display={`${glidePct}`} unit="%" color={visc > 0.5 ? '#C0562F' : '#86B98C'} />
          <Gauge value={romPct / 100} label="可動域(ROM)" display={`${romPct}`} unit="%" color="#5E8BA8" />
        </div>

        <label className="slider-row">
          <span className="slider-name" style={{ color: '#C0562F' }}>
            高密度化
          </span>
          <input type="range" min="0" max="1" step="0.01" value={dens} onChange={(e) => setDens(+e.target.value)} />
          <span className="slider-val">{Math.round(dens * 100)}%</span>
        </label>

        <button
          className="load-btn warm"
          onPointerDown={() => (warming.current = true)}
          onPointerUp={() => (warming.current = false)}
          onPointerLeave={() => (warming.current = false)}
        >
          長押しで「動かして温める」🔥 {warmth > 0.02 ? `(+${Math.round(warmth * 100)}%)` : ''}
        </button>

        <div className="fascia-note">
          <b>深筋膜</b>は2〜3層のコラーゲン線維が<b>ヒアルロン酸</b>の膜で滑走する構造。使いすぎ・不動・加齢でHAの粘度が上がる「高密度化(densification)」が起きると層が癒着し、滑走・力の伝達・
          <b>固有感覚</b>が低下します。HAの粘度は温度・運動に依存 — 動かして温めると一時的に滑走が回復します。
        </div>

        <div className={`iap-verdict ${glide > 0.7 && visc <= 0.5 ? 'good' : visc > 0.5 && warmth <= 0.25 ? 'bad' : ''}`}>{verdict}</div>
      </div>
    </div>
  );
}

function FasciaLayer({ y, shift, angle, label }: { y: number; shift: number; angle: number; label: string }) {
  const h = 40;
  const lines = Array.from({ length: 9 }, (_, i) => 40 + i * 48);
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * 16;
  const dy = Math.sin(rad) * 16;
  return (
    <g style={{ transform: `translateX(${shift}px)`, transition: 'none' }}>
      <rect x="20" y={y} width="430" height={h} rx="8" fill="#e8e2d2" opacity="0.14" />
      <rect x="20" y={y} width="430" height={h} rx="8" fill="none" stroke="#ddd6c4" strokeOpacity="0.4" strokeWidth="1" />
      {lines.map((x, i) => (
        <line key={i} x1={x - dx} y1={y + h / 2 - dy} x2={x + dx} y2={y + h / 2 + dy} stroke="#ddd6c4" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      ))}
      <text x="30" y={y + 15} fontSize="10" fontWeight="700" fill="#ddd6c4" opacity="0.85">
        {label}
      </text>
    </g>
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
