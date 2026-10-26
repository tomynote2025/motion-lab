import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { IapAnatomy3D, type IapFocus } from '../three/IapAnatomy3D';
import { LabHead } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';

/**
 * 腹腔内圧(IAP)シミュレーター
 * 横隔膜(天井)・腹壁(壁)・骨盤底(床)の協調で、胴体の中の「圧の風船」がどう変わるかを、
 * 実際の解剖データ(BodyParts3D)から作った 3D モデルで体験する。
 */

type PresetId = 'balance' | 'brace' | 'leak';
const PRESETS: Record<PresetId, [number, number, number]> = {
  balance: [0.82, 0.8, 0.8],
  brace: [0.18, 0.95, 0.28],
  leak: [0.82, 0.28, 0.18],
};

// --- 部位ごとに見る(Visible Body のように、選んだ部位だけを出す) ---
type FocusPart = Exclude<IapFocus, 'all'>;
type FocusMode = 'good' | 'bad';
const PARTS: { id: IapFocus; label: string }[] = [
  { id: 'all', label: '全体' },
  { id: 'diaphragm', label: '横隔膜' },
  { id: 'wall', label: '腹壁' },
  { id: 'floor', label: '骨盤底' },
  { id: 'spine', label: '背骨' },
];
/** 部位表示のときの [横隔膜, 腹壁, 骨盤底] の値。崩れたときは、その部位が働きにくい例 */
const FOCUS_VALUES: Record<FocusPart, Record<FocusMode, [number, number, number]>> = {
  diaphragm: { good: [0.85, 0.82, 0.82], bad: [0.12, 0.82, 0.8] },
  wall: { good: [0.85, 0.82, 0.82], bad: [0.82, 0.12, 0.8] },
  floor: { good: [0.85, 0.82, 0.82], bad: [0.82, 0.8, 0.12] },
  spine: { good: [0.85, 0.82, 0.82], bad: [0.18, 0.95, 0.28] },
};
const FOCUS_TEXT: Record<FocusPart, Record<FocusMode, string>> = {
  diaphragm: {
    good: '息を吸うとドームが下がって平らになり、お腹の中身を下へ押して圧を高めます。息を吐くと元の高さへ戻ります。負荷がかかっても働き続け、呼吸と支えを両立します。',
    bad: '（例）下がる動きが小さく、負荷がかかると圧に押し上げられます。天井が受け止めきれず、圧が上へ逃げています。',
  },
  wall: {
    good: '息を吸うと、前だけでなく横や後ろにも広がり、吐くと戻ります。負荷がかかっても張りを保ち、内側からの圧を受け止めます。',
    bad: '（例）圧を受け止めきれず、お腹の前側が押し出されます。壁が受け止めきれず、圧が前へ逃げています。',
  },
  floor: {
    good: '息を吸うとわずかに下がり、吐くと持ち上がります。負荷がかかると、下から支えるように働きます。',
    bad: '（例）負荷がかかると下へ押し下げられます。床が受け止めきれず、圧が下へ逃げています。',
  },
  spine: {
    good: '天井・壁・床がそろって圧を保つので、負荷がかかっても背骨はまっすぐ保たれます。',
    bad: '（例）腹圧で支えきれず、背骨にしわ寄せがきて丸まる方向へ崩れています。反る方向に崩れることもあり、崩れ方は人によって異なります。',
  },
};
/** カメラが寄る位置(モデル座標)と距離 */
const FOCUS_CAMERA: Record<IapFocus, { at: [number, number, number]; dist: number }> = {
  all: { at: [0, 0.25, 0.45], dist: 5.3 },
  diaphragm: { at: [0, 0.4, 0.45], dist: 3.8 },
  wall: { at: [0, -0.05, 0.6], dist: 4.0 },
  floor: { at: [0, -0.75, 0.3], dist: 3.2 },
  spine: { at: [0, 0.15, 0.3], dist: 4.6 },
};
const MODEL_ROT_Y = -0.95;
const MODEL_OFFSET = new THREE.Vector3(0, -0.25, -0.45);

/** 選んだ部位へ、今の向きのままカメラをなめらかに寄せる */
function CameraRig({ focus }: { focus: IapFocus }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.Camera; controls: { target: THREE.Vector3; update: () => void } | null };
  const goal = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    if (!controls) return;
    const c = FOCUS_CAMERA[focus];
    goal.current.set(...c.at).add(MODEL_OFFSET).applyAxisAngle(new THREE.Vector3(0, 1, 0), MODEL_ROT_Y);
    const k = Math.min(dt * 3, 1);
    controls.target.lerp(goal.current, k);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const want = controls.target.clone().add(dir.multiplyScalar(c.dist));
    camera.position.lerp(want, k);
    controls.update();
  });
  return null;
}

// 「▶ まず見る」の流れ(秒)
const DEMO: { at: number; preset: PresetId; hold: boolean; caption: string; tone: 'good' | 'bad' | '' }[] = [
  { at: 0, preset: 'balance', hold: false, caption: '息を吸うと、天井(横隔膜)と床(骨盤底)が下がり、壁(腹壁)が広がります。', tone: '' },
  { at: 3.2, preset: 'balance', hold: true, caption: '3つがそろうと、圧の風船が内側から背骨を支えます。上から負荷がかかっても、背骨はまっすぐ保たれます。', tone: 'good' },
  { at: 6.8, preset: 'brace', hold: true, caption: 'お腹だけ固めると、天井と床が受け止めず、圧が上と下へ逃げます。腹圧が足りないとき、この例では背骨が丸まる方向へ崩れています。', tone: 'bad' },
  { at: 10.4, preset: 'leak', hold: true, caption: '壁(腹壁)が働かないと、圧が前と下へ逃げます。この例では、腰が反る方向へ崩れています。崩れ方は一例で、人によって異なります。', tone: 'bad' },
  { at: 14, preset: 'balance', hold: false, caption: 'ひとつを強く固めるより、3つを一緒に働かせることが大切です。スライダーでも試してみてください。', tone: '' },
];
const DEMO_END = 17;
/** 自分の体重(上半身の重さ)による、常にかかっている負荷 */
const BASE_LOAD = 0.55;

export function IapLab() {
  const [sliderDia, setDia] = useState(0.82); // 横隔膜の下降
  const [sliderTva, setTva] = useState(0.8); // 腹壁の全周性拡張
  const [sliderPf, setPf] = useState(0.8); // 骨盤底の追従
  const [focus, setFocus] = useState<IapFocus>('all');
  const [focusMode, setFocusMode] = useState<FocusMode>('good');
  const [advanced, setAdvanced] = useState(false);
  const focusRef = useRef<IapFocus>('all');
  focusRef.current = focus;
  // 部位表示中は、その部位の「良い動き／崩れたとき」の値を使う
  const [dia, tva, pf] = focus === 'all' ? [sliderDia, sliderTva, sliderPf] : FOCUS_VALUES[focus][focusMode];
  const [frame, setFrame] = useState({ breath: 0, load: 0, sDia: 0.82, sTva: 0.8, sPf: 0.8 });
  // 3Dモデルは目標値へなめらかに近づける(状態を切り替えたとき、背骨が少しずつ崩れる/戻る)
  const targetRef = useRef({ dia: 0.82, tva: 0.8, pf: 0.8 });
  targetRef.current = { dia, tva, pf };
  const [preset, setPreset] = useState<PresetId | 'custom'>('balance');
  const [demoStep, setDemoStep] = useState(-1);
  const holdRef = useRef(false);
  const rafRef = useRef(0);
  const demoStart = useRef(0);
  const demoStepRef = useRef(-1);
  const demoActiveRef = useRef(false);

  const applyPreset = (id: PresetId) => {
    setPreset(id);
    setDia(PRESETS[id][0]);
    setTva(PRESETS[id][1]);
    setPf(PRESETS[id][2]);
  };

  useEffect(() => {
    let t = 0;
    let load = 0;
    const sm = { ...targetRef.current };
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      // デモ進行
      if (demoActiveRef.current) {
        const el = (now - demoStart.current) / 1000;
        if (el >= DEMO_END) {
          demoActiveRef.current = false;
          demoStepRef.current = -1;
          holdRef.current = false;
          setDemoStep(-1);
        } else {
          let step = 0;
          DEMO.forEach((d, i) => {
            if (el >= d.at) step = i;
          });
          if (step !== demoStepRef.current) {
            demoStepRef.current = step;
            setDemoStep(step);
            applyPreset(DEMO[step].preset);
            holdRef.current = DEMO[step].hold;
          }
        }
      }

      const breath = (Math.sin(t * 1.4) + 1) / 2; // 0=呼気, 1=吸気
      // 部位表示中は、数秒おきに自動で負荷をかけて「負荷を受けた瞬間」の反応を見せる
      const autoLoad = focusRef.current !== 'all' && t % 7 > 4.2;
      load += ((holdRef.current || autoLoad ? 1 : 0) - load) * Math.min(dt * 4, 1);
      const k = Math.min(dt * 3, 1);
      sm.dia += (targetRef.current.dia - sm.dia) * k;
      sm.tva += (targetRef.current.tva - sm.tva) * k;
      sm.pf += (targetRef.current.pf - sm.pf) * k;
      setFrame({ breath, load, sDia: sm.dia, sTva: sm.tva, sPf: sm.pf });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const startDemo = () => {
    setFocus('all');
    demoStart.current = performance.now();
    demoStepRef.current = -1; // 次のフレームで step 0 を適用させる
    demoActiveRef.current = true;
    setDemoStep(0);
  };
  const stopDemo = () => {
    demoActiveRef.current = false;
    demoStepRef.current = -1;
    holdRef.current = false;
    setDemoStep(-1);
  };
  const demoRunning = demoStep >= 0;

  const { breath, load: pressLoad, sDia, sTva, sPf } = frame;
  // 立っているだけでも上半身の重さがかかっているので、常に一定の負荷(BASE_LOAD)をかけておく。
  // これで状態を切り替えただけでも背骨の崩れ方が変わり、長押しでさらに大きな負荷になる。
  const load = BASE_LOAD + (1 - BASE_LOAD) * pressLoad;

  // --- 教育用の呼吸・支持モデル ---
  const drop = breath * (12 + 36 * dia);
  const coordination = Math.max(0, 1 - (Math.abs(dia - tva) + Math.abs(dia - pf) + Math.abs(tva - pf)) / 2.1);
  const movementQuality = (dia + tva + pf) / 3;
  const breathPressure = (drop / 48) * (0.3 + 0.7 * ((tva + pf) / 2));
  const posturalPressure = load * coordination * movementQuality * 0.62;
  const pressure = Math.min(breathPressure * (1 - load * 0.25) + posturalPressure, 1);
  const support = Math.min((0.35 + pressure * 0.65) * coordination * movementQuality, 1);
  const stress = Math.max(0, load * 0.95 - support);
  // 崩れる方向(IapAnatomy3D と同じ考え方): 正=丸まる(屈曲), 負=反る(伸展)
  const collapseBias = (1 - (dia + pf) / 2) - (1 - tva);
  // 実測値(mmHg)と誤解されないよう、圧の高まりは言葉の目安で示す
  const pressureWord = pressure < 0.35 ? '低い' : pressure < 0.65 ? '中くらい' : '高い';
  const stability = Math.round(support * 100);
  // 数字だと測定値に見えるので、支えの状態は言葉で示す
  const supportWord = stress > 0.25 ? '崩れやすい' : stress > 0.08 ? 'やや弱い' : 'しっかり';

  const changeValue = (setter: (value: number) => void, value: number) => {
    if (demoRunning) stopDemo();
    if (focus !== 'all') {
      setDia(dia);
      setTva(tva);
      setPf(pf);
      setFocus('all');
    }
    setPreset('custom');
    setter(value);
  };

  const gaugeCirc = 2 * Math.PI * 52;
  const demo = demoRunning ? DEMO[demoStep] : null;

  return (
    <section id="iap" className="section">
      <LabHead
        id="iap"
        lead="腹圧は「お腹を固める力」だけではありません。横隔膜（天井）・お腹の壁・骨盤底（床）が呼吸に合わせて協調し、体幹を内側から支える仕組みのひとつと考えられています。"
        steps="まず「▶ まず見る」で流れを確かめ、次に3つの状態を切り替えて比べます。部位ごとの動きや数値を動かしたいときは「詳しく動かす」を開きます。"
        read="背骨がまっすぐ保たれ、「背骨の支え」が「しっかり」なら、圧がうまく受け止められている状態です。背骨が丸まる・反るのは、支えきれないときの一例として表しています。"
      />

      <div className="iap-canister" aria-label="腹圧を作る3つの要素">
        <div><span>01 / CEILING</span><b>横隔膜</b><p>吸気で収縮・下降し、呼気で上昇する「天井」</p></div>
        <i>＋</i>
        <div><span>02 / WALL</span><b>腹壁</b><p>吸気で前・側方・後方へ広がり、呼気で戻る「壁」</p></div>
        <i>＋</i>
        <div><span>03 / FLOOR</span><b>骨盤底</b><p>吸気で下降、呼気で上昇し、負荷時は支持する「床」</p></div>
        <strong>＝ 360°の支持</strong>
      </div>

      <div className="iap-compare">
        <div className="iap-compare-head"><span>COMPARE</span><b>3つの状態を切り替えて比べる</b></div>
        <div className="iap-presets">
          <button className={preset === 'balance' && focus === 'all' ? 'active' : ''} onClick={() => { stopDemo(); setFocus('all'); applyPreset('balance'); }}><span>◎</span><b>呼吸と支持が協調</b><small>3つが同じリズムで動く</small></button>
          <button className={preset === 'brace' && focus === 'all' ? 'active' : ''} onClick={() => { stopDemo(); setFocus('all'); applyPreset('brace'); }}><span>△</span><b>お腹だけ固める</b><small>横隔膜と骨盤底が追従しない</small></button>
          <button className={preset === 'leak' && focus === 'all' ? 'active' : ''} onClick={() => { stopDemo(); setFocus('all'); applyPreset('leak'); }}><span>△</span><b>協調が崩れる</b><small>壁と床が圧を受け止めない</small></button>
        </div>
        <p className="iap-compare-note">
          ※ 背骨の崩れ方（丸まる／反る）は一例です。どの方向に崩れるかは、姿勢のくせ・関節や筋の状態・動作の内容によって人それぞれで、決まっているわけではありません。
        </p>
      </div>

      {advanced && (
      <div className="iap-compare iap-parts">
        <div className="iap-compare-head"><span>PARTS</span><b>部位を選んで、動きだけを見る</b></div>
        <div className="region-chips" role="tablist" aria-label="表示する部位">
          {PARTS.map((part) => (
            <button
              key={part.id}
              className={`chip ${focus === part.id ? 'chip-active' : ''}`}
              onClick={() => {
                stopDemo();
                setFocus(part.id);
              }}
            >
              {part.label}
            </button>
          ))}
        </div>
        {focus !== 'all' && (
          <>
            <div className="iap-mode-toggle">
              <button className={focusMode === 'good' ? 'active good' : ''} onClick={() => setFocusMode('good')}>◎ 良い動き</button>
              <button className={focusMode === 'bad' ? 'active bad' : ''} onClick={() => setFocusMode('bad')}>△ 内圧が崩れたとき</button>
            </div>
            <p className="iap-part-caption">
              <b>{PARTS.find((p) => p.id === focus)?.label}｜{focusMode === 'good' ? '良い動き' : '内圧が崩れたとき'}</b>
              {FOCUS_TEXT[focus][focusMode]}
              <span>数秒おきに自動で負荷がかかります。負荷を受けた瞬間の動きを見てください。</span>
            </p>
          </>
        )}
      </div>
      )}

      <div className="iap-grid">
        <div className="iap-stage iap-stage-3d">
          <div className="iap-canvas" aria-label="腹腔内圧の3D解剖モデル">
            <Canvas camera={{ position: [0, 0.2, 5.3], fov: 36 }} dpr={[1, 2]}>
              <ambientLight intensity={0.65} />
              <directionalLight position={[4, 6, 6]} intensity={1.2} />
              <pointLight position={[-6, -2, 5]} color="#5E8BA8" intensity={30} />
              <pointLight position={[6, 3, -4]} color="#C0562F" intensity={20} />
              <Suspense fallback={null}>
                <group rotation={[0, MODEL_ROT_Y, 0]}>
                  <IapAnatomy3D dia={sDia} tva={sTva} pf={sPf} load={load} pressLoad={pressLoad} breath={breath} focus={focus} gain={focus === 'all' ? 1 : 1.5} />
                </group>
              </Suspense>
              <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.8} maxPolarAngle={Math.PI / 1.8} />
              <CameraRig focus={focus} />
            </Canvas>
          </div>
          <div className="iap-breath-tag">
            <b>{breath > 0.5 ? '↓ 吸気(息を吸う)' : '↑ 呼気(息を吐く)'}</b>
            <span>{breath > 0.5 ? '横隔膜・骨盤底は下降 / 腹壁は広がる' : '横隔膜・骨盤底は上昇 / 腹壁は戻る'}</span>
          </div>
          <div className="iap-drag-hint">DRAG TO ROTATE</div>
        </div>

        <div className="iap-controls">
          <button className={`fascia-demo-btn ${demoRunning ? 'playing' : ''}`} onClick={demoRunning ? stopDemo : startDemo}>
            {demoRunning ? '■ 止める' : '▶ まず見る（約17秒）'}
          </button>
          {demo && <div className={`iap-verdict ${demo.tone}`}>{demo.caption}</div>}

          <div className="iap-gauges">
            <div className="gauge">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#C0562F"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCirc}
                  strokeDashoffset={gaugeCirc * (1 - pressure)}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="62" textAnchor="middle" className="gauge-word" fill="#1B1B17">
                  {pressureWord}
                </text>
                <text x="60" y="80" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                  目安
                </text>
              </svg>
              <span>腹圧の高まり</span>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={stress > 0.25 ? '#C0562F' : '#86B98C'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCirc}
                  strokeDashoffset={gaugeCirc * (1 - stability / 100)}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="62" textAnchor="middle" className="gauge-word" fill="#1B1B17">
                  {supportWord}
                </text>
                <text x="60" y="80" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                  目安
                </text>
              </svg>
              <span>背骨の支え</span>
            </div>
          </div>

          <button
            className="load-btn"
            onPointerDown={() => {
              if (demoRunning) stopDemo();
              holdRef.current = true;
            }}
            onPointerUp={() => (holdRef.current = false)}
            onPointerLeave={() => (holdRef.current = false)}
          >
            長押しで負荷を加える
          </button>

          <button
            className="iap-more-btn"
            aria-expanded={advanced}
            onClick={() => {
              if (advanced) {
                setFocus('all');
              }
              setAdvanced(!advanced);
            }}
          >
            {advanced ? '詳しい操作を閉じる ▲' : '詳しく動かす（部位ごとの動き・数値） ▼'}
          </button>
          {advanced && (
            <div className="iap-sliders">
              <p className="iap-sliders-note">3つの動きの大きさを変えると、腹圧と背骨の支えがどう変わるかを確かめられます。部位ごとの動きは、3Dの上の「部位を選んで、動きだけを見る」で切り替えます。</p>
              <label className="slider-row">
                <span className="slider-name" style={{ color: '#5E8BA8' }}>
                  横隔膜の下降
                </span>
                <input type="range" min="0" max="1" step="0.01" value={dia} onChange={(e) => changeValue(setDia, +e.target.value)} />
                <span className="slider-val">{Math.round(dia * 100)}%</span>
              </label>
              <label className="slider-row">
                <span className="slider-name" style={{ color: '#86B98C' }}>
                  腹壁の広がり
                </span>
                <input type="range" min="0" max="1" step="0.01" value={tva} onChange={(e) => changeValue(setTva, +e.target.value)} />
                <span className="slider-val">{Math.round(tva * 100)}%</span>
              </label>
              <label className="slider-row">
                <span className="slider-name" style={{ color: '#C9982F' }}>
                  骨盤底の追従
                </span>
                <input type="range" min="0" max="1" step="0.01" value={pf} onChange={(e) => changeValue(setPf, +e.target.value)} />
                <span className="slider-val">{Math.round(pf * 100)}%</span>
              </label>
            </div>
          )}

          {!demo && (
            <div className={`iap-verdict ${stress > 0.25 ? 'bad' : pressure > 0.55 ? 'good' : ''}`}>
              {stress > 0.25
                ? collapseBias >= 0
                  ? '⚠ 負荷に対して腹圧が足りず、背骨が支えきれていません（この例では丸まる方向に崩れています）。天井と床から圧が逃げる矢印を確認してください。'
                  : '⚠ 負荷に対して腹圧が足りず、背骨が支えきれていません（この例では腰が反る方向に崩れています）。お腹の前側(壁)から圧が逃げる矢印を確認してください。'
                : support > 0.55 && coordination > 0.72
                  ? '◎ 吸気で3つが一緒に下降・拡張し、呼気で一緒に戻っています。負荷時も呼吸を残しながら支持できる状態です。'
                  : coordination < 0.55
                    ? '△ 動くタイミングが揃っていません。ひとつを強く固めるより、3つが一緒に動くことが大切です。'
                    : '吸気では横隔膜と骨盤底が下降し、腹壁が広がります。呼気では3つが一緒に元の位置へ戻ります。'}
            </div>
          )}
          <p className="iap-disclaimer">
            ※ 表示は仕組みを理解するための教育用モデルで、実測値や医学的診断を示すものではありません（健康な成人の安静時の腹腔内圧は、おおむね 7 mmHg 未満とされます）。
            <br />
            参考: Hodges PW, Gandevia SC (2000) J Appl Physiol 89(3):967-976（姿勢と呼吸での横隔膜と腹腔内圧）／Talasz H ら (2011) Int Urogynecol J（呼吸で横隔膜と骨盤底が同じ向きに動く）／Hagins M ら (2004) Spine 29(4):464-469（呼吸の仕方と持ち上げ動作時の腹腔内圧）。
            <br />
            3Dモデル: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International（腹圧の説明用に一部を抜き出し、改変して使用。腹壁は外腹斜筋のデータで表示）
          </p>
        </div>
      </div>
      <WhyQuiz
        question="息を吸うとき、骨盤の底（骨盤底）はどちらへ動く？"
        choices={["上がる", "下がる", "動かない"]}
        answer={1}
        explain="息を吸うと、横隔膜が下がり、骨盤底も同じ向きに下がることが、画像を使った研究で示されています（Talasz ら 2011）。息を吐くと、どちらも元の位置へ戻ります。天井と床が一緒に動くイメージです。"
      />
    </section>
  );
}
