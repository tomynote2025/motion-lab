import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FasciaNetworkModel, DENSITY_POINTS, type DensityPointId } from '../three/FasciaNetworkModel';

/**
 * FASCIA NETWORK — 筋膜は全身をつなぐ一枚のシート、を「前屈」という
 * 実際の動きを通じて体感するセクション。
 *
 * アキレス腱／ハムストリングス／殿筋・腰背部 の3ポイントから「どこが硬いか」を選べるようにし、
 * 「下肢後面全体が均等に硬い」という単一パターンにならないようにしている。
 * 選んだポイントが高密度化(硬さ)しているほど、
 *   1. 股関節が曲がらなくなり前屈が浅くなる(可動域制限)
 *   2. その分、腰が過剰に丸まって代償する(=腰にストレスが集中する)
 * ことをアニメーションで見せる。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const BEND_DURATION = 1.6; // 秒

export function FasciaNetworkLab() {
  const [selectedPoint, setSelectedPoint] = useState<DensityPointId>('hamstring');
  const [densification, setDensification] = useState(0.15); // 健康な状態からスタート
  const [bendProgress, setBendProgress] = useState(0);
  const [animPhase, setAnimPhase] = useState<'idle' | 'bending'>('idle');
  const animPhaseRef = useRef(animPhase);
  const bendStart = useRef(0);
  animPhaseRef.current = animPhase;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (animPhaseRef.current === 'bending') {
        const t = (performance.now() - bendStart.current) / 1000;
        const p = clamp(t / BEND_DURATION, 0, 1);
        setBendProgress(p);
        if (p >= 1) setAnimPhase('idle');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bend = () => {
    bendStart.current = performance.now();
    setAnimPhase('bending');
  };
  const standUp = () => {
    setAnimPhase('idle');
    setBendProgress(0);
  };

  const bent = bendProgress >= 0.999;
  const bending = animPhase === 'bending';
  const pointLabel = DENSITY_POINTS.find((p) => p.id === selectedPoint)!.label;

  // 見た目の指標(スライダーと連動する説明用の数値)
  const romPct = Math.round(lerpPct(78, 20, densification));
  const stressPct = Math.round(densification * 100);

  const verdict = bent
    ? densification > 0.55
      ? `⚠ この仮想モデルでは股関節の動きが小さく、腰の動きが増えています。選択点が実際の原因だと確定するものではありません。`
      : densification > 0.25
        ? '○ この仮想モデルでは、股関節と腰の運動配分が少し変化しています。'
        : '◎ この仮想モデルでは、股関節を中心に前屈しています。'
    : '';

  return (
    <section id="fascia-network" className="section">
      <div className="section-head">
        <span className="section-index">05 / FASCIA NETWORK</span>
        <h2>
          FASCIA NETWORK<span className="jp-sub">筋膜のつながり</span>
        </h2>
        <p className="section-lead">
          Fascial Manipulation®では、筋膜を身体各部の張力と動きをつなぐシステムとして捉えます。張力が集まる特定部位を<b>協調中心（Center of Coordination / CC）</b>と呼び、症状部位から離れたCCも評価候補に含めます。下の光る点は、CCの考え方を理解するための<b>仮想的な候補点</b>です。
        </p>
      </div>

      <div className="fascia-assessment-flow" aria-label="Stecco法の評価プロセス">
        <div><span>01</span><b>症状と経過を聞く</b><p>痛む場所だけでなく、過去の症状や負荷の履歴を整理</p></div>
        <i>→</i>
        <div><span>02</span><b>運動を比較する</b><p>どの方向・関節で運動協調が変化するかを観察</p></div>
        <i>→</i>
        <div><span>03</span><b>候補点を絞る</b><p>離れた部位も含め、張力が集まるCCの仮説を立てる</p></div>
        <i>→</i>
        <div><span>04</span><b>触診で確認する</b><p>専門家が組織の反応を確認して初めて判断する</p></div>
      </div>

      <div className="bodymap-grid">
        <div className="bodymap-canvas" aria-label="前屈と筋膜の高密度化の3Dモデル">
          <Canvas camera={{ position: [0, 0.3, 10.6], fov: 42 }} dpr={[1, 2]}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[4, 6, 6]} intensity={1.2} />
            <pointLight position={[-6, -2, 5]} color="#5E8BA8" intensity={30} />
            <pointLight position={[6, 3, -4]} color="#C0562F" intensity={20} />
            <Suspense fallback={null}>
              <FasciaNetworkModel
                densification={densification}
                bendProgress={bendProgress}
                selectedPoint={selectedPoint}
                onSelectPoint={setSelectedPoint}
              />
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              autoRotate={animPhase === 'idle' && bendProgress === 0}
              autoRotateSpeed={0.7}
              minPolarAngle={Math.PI / 2.8}
              maxPolarAngle={Math.PI / 1.8}
              target={[0, -0.1, 0]}
            />
          </Canvas>
          <div className="bodymap-hint">光る点をタップ / DRAG TO ROTATE</div>
        </div>

        <div className="iap-controls">
          <div className="fascia-task-label"><span>STEP 01</span><b>評価する仮想候補点を選ぶ</b></div>
          <div className="region-chips" role="tablist" aria-label="評価する仮想候補点を選択">
            {DENSITY_POINTS.map((p) => (
              <button
                key={p.id}
                className={`chip ${selectedPoint === p.id ? 'chip-active' : ''}`}
                disabled={bending}
                onClick={() => setSelectedPoint(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button className={`fascia-demo-btn ${bending ? 'playing' : ''}`} onClick={bending ? standUp : bent ? standUp : bend}>
            {bending ? '■ 前屈中…' : bent ? '↺ 立ち上がる' : '▶ 前屈してみる'}
          </button>

          <div className="iap-gauges">
            <Gauge value={1 - densification} label="モデル上の滑走性" display={`${Math.round((1 - densification) * 100)}`} unit="%" color="#86B98C" />
            <Gauge value={romPct / 100} label="モデル上の運動配分" display={`${romPct}`} unit="%" color="#5E8BA8" />
          </div>

          <label className="slider-row">
            <span className="slider-name" style={{ color: '#C0562F' }}>
              滑走抵抗
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={densification}
              disabled={bending}
              onChange={(e) => setDensification(+e.target.value)}
            />
            <span className="slider-val">{stressPct}%</span>
          </label>

          <div className="fascia-note">
            <b>{pointLabel}</b>を仮想的な評価候補として選んでいます。滑走抵抗を上げて「前屈してみる」を押すと、このモデル上で股関節と腰の運動配分が変わります。候補点を切り替え、<b>症状の場所だけを見るのではなく複数の仮説を比較する</b>という考え方を体験してください。
          </div>

          {bent && <div className={`iap-verdict ${densification > 0.55 ? 'bad' : densification < 0.25 ? 'good' : ''}`}>{verdict}</div>}
        </div>
      </div>

      <p className="neuro-caution">
        参考: Fascial Manipulation® Institute by Stecco が示す「協調中心」「高密度化」「全身を多因子的に評価する」方法論を単純化しています。表示している点は正式なCCマップではなく、選択点と痛みの因果関係を示すものでもありません。実際の判断には問診・運動検査・専門的な触診が必要です。
      </p>
    </section>
  );
}

function lerpPct(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

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
