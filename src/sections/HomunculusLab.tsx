import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * HOMUNCULUS LAB — 脳の中の体の地図(体性感覚)
 *
 * 実際の体 ⇄「脳の中の体」(感覚の地図の広さで描いた体)をスライダーで変形させる。
 * 根拠(文言の範囲):
 *  - 体性感覚の地図(Penfield & Boldrey 1937)。図は単純化したもの。
 *  - 運動野の地図には、全身の動きをまとめる領域が手足の領域の間に挟まっている(Gordon ら 2023, Nature)。
 *  - 地図の広さは触覚の神経の密度と弱い関係しかなく、手や顔の広さを説明しきれない(Corniani & Saal 2020)。
 *    両手のひらに全身の触覚神経の約15%、顔と唇のまわりに約19%。
 *  - CRPS では患側の手の地図が小さい結果が比較的一貫(Di Pietro 2013、研究は少なく質に課題)。
 *  - 慢性腰痛などで触覚の鋭さが低下する報告(Catley 2014、質に課題)。地図の変化は結果が分かれる(Flor 1997 など)。
 *  - 感覚識別トレーニング: 10件のRCTで、慢性腰痛は結果が食い違い、ほかは質の低い研究のみ(Graham 2022)。
 *  - 従来の2点識別は距離以外の手がかりで答えられてしまう。向き当てのほうが妥当(Tong 2013)。
 */

const SKIN = '#e3cdb4';
const ACTIVE = '#C0562F';

type Vec3 = [number, number, number];
type PartId = 'hand' | 'face' | 'foot' | 'trunk' | 'limb';

const PARTS: { id: PartId; label: string; size: string; text: string }[] = [
  {
    id: 'hand',
    label: '手・指',
    size: 'とても広い',
    text: '脳の地図の中で特に広い場所です。両手のひらの皮膚には、全身の触覚の神経のおよそ15%が集まっています。指先は、数ミリ離れた2点も感じ分けられます。',
  },
  {
    id: 'face',
    label: '唇・顔',
    size: 'とても広い',
    text: '唇や顔も広く描かれます。顔と唇のまわりには、全身の触覚の神経のおよそ2割が集まっています。食べる・話す・表情をつくるには、細かい感覚が欠かせません。',
  },
  {
    id: 'foot',
    label: '足',
    size: '手や顔ほどではない',
    text: '手や顔ほど広くは描かれません。それでも足裏の感覚は、立つ・歩くときにバランスをとる手がかりのひとつになっています。',
  },
  {
    id: 'trunk',
    label: '背中・お腹',
    size: '狭い',
    text: '体の大きさの割に狭い場所です。背中では、数センチ離さないと2点だと分からないことがよくあります。',
  },
  {
    id: 'limb',
    label: '腕・脚',
    size: '狭め',
    text: '長さの割には狭めに描かれます。肩や太ももは、指先ほど細かくは感じ分けられません。',
  },
];

/** 「脳の中の体」にしたときの拡大率 */
const SCALE: Record<PartId, number> = { hand: 3.1, face: 1.7, foot: 1.4, trunk: 0.62, limb: 0.6 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Capsule({ from, to, r, material }: { from: Vec3; to: Vec3; r: number; material: THREE.Material }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = Math.max(dir.length() - r * 1.2, 0.02);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={a.clone().lerp(b, 0.5)} quaternion={quat} material={material}>
      <capsuleGeometry args={[r, len, 6, 16]} />
    </mesh>
  );
}

/** 手のひら+5本の指。手首を原点に、下向きに伸びる */
function Hand({ side, material }: { side: 1 | -1; material: THREE.Material }) {
  const fingers: { x: number; len: number }[] = [
    { x: -0.07, len: 0.16 },
    { x: -0.023, len: 0.19 },
    { x: 0.023, len: 0.18 },
    { x: 0.068, len: 0.14 },
  ];
  return (
    <group>
      <mesh position={[0, -0.12, 0]} scale={[0.13, 0.13, 0.05]} material={material}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      {fingers.map((f, i) => (
        <Capsule key={i} from={[f.x * side, -0.2, 0]} to={[f.x * 1.15 * side, -0.2 - f.len, 0.01]} r={0.022} material={material} />
      ))}
      <Capsule from={[-0.1 * side, -0.1, 0.02]} to={[-0.17 * side, -0.2, 0.05]} r={0.026} material={material} />
    </group>
  );
}

function Figure({ morph, selected }: { morph: number; selected: PartId }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.04;
  });

  // 選択中の部位だけ色を変える(材質は選択が変わったときだけ作り直す)
  const mats = useMemo(() => {
    const m = {} as Record<PartId, THREE.MeshStandardMaterial>;
    (['hand', 'face', 'foot', 'trunk', 'limb'] as PartId[]).forEach((id) => {
      m[id] = new THREE.MeshStandardMaterial({
        color: selected === id ? ACTIVE : SKIN,
        emissive: selected === id ? ACTIVE : '#000000',
        emissiveIntensity: selected === id ? 0.35 : 0,
        roughness: 0.6,
      });
    });
    return m;
  }, [selected]);
  const mat = (id: PartId) => mats[id];
  const s = (id: PartId) => lerp(1, SCALE[id], morph);

  const trunkR = 0.42 * s('trunk');
  const limbR = s('limb');
  const head = 0.42 * s('face');
  const headY = 2.45 + head;
  const lipsScale = lerp(1, 3.6, morph);

  const shoulderX = 0.32 + trunkR * 0.9;
  const wrist = (side: 1 | -1): Vec3 => [side * (shoulderX + 0.42), 0.35, 0.05];

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* 体幹 */}
      <Capsule from={[0, 0.25, 0]} to={[0, 2.05, 0]} r={trunkR} material={mat('trunk')} />
      {/* 頭・顔 */}
      <mesh position={[0, headY, 0]} material={mat('face')}>
        <sphereGeometry args={[head, 28, 24]} />
      </mesh>
      {/* 唇 */}
      <mesh position={[0, headY - head * 0.42, head * 0.86]} scale={[0.11 * lipsScale, 0.045 * lipsScale, 0.06 * lipsScale]} material={mat('face')}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      {/* 鼻 */}
      <mesh position={[0, headY - head * 0.05, head * 0.95]} scale={[0.05 * s('face'), 0.08 * s('face'), 0.06 * s('face')]} material={mat('face')}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>

      {/* 腕と手 */}
      {([1, -1] as const).map((side) => (
        <group key={side}>
          <Capsule from={[side * shoulderX, 1.95, 0]} to={[side * (shoulderX + 0.28), 1.15, 0.02]} r={0.1 * limbR} material={mat('limb')} />
          <Capsule from={[side * (shoulderX + 0.28), 1.15, 0.02]} to={wrist(side)} r={0.08 * limbR} material={mat('limb')} />
          <group position={wrist(side)} scale={s('hand')}>
            <Hand side={side} material={mat('hand')} />
          </group>
        </group>
      ))}

      {/* 脚と足 */}
      {([1, -1] as const).map((side) => (
        <group key={`l${side}`}>
          <Capsule from={[side * 0.24, 0.2, 0]} to={[side * 0.3, -1.25, 0]} r={0.13 * limbR} material={mat('limb')} />
          <Capsule from={[side * 0.3, -1.25, 0]} to={[side * 0.32, -2.55, 0]} r={0.1 * limbR} material={mat('limb')} />
          <group position={[side * 0.32, -2.62, 0.02]} scale={s('foot')}>
            <mesh position={[0, -0.04, 0.14]} scale={[0.1, 0.06, 0.22]} material={mat('foot')}>
              <sphereGeometry args={[1, 18, 14]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

export function HomunculusLab() {
  const [morph, setMorph] = useState(0);
  const [selected, setSelected] = useState<PartId>('hand');
  const [auto, setAuto] = useState(false);
  const raf = useRef(0);

  // 「変形を見る」: 実際の体 → 脳の中の体 → 実際の体
  useEffect(() => {
    if (!auto) return;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      const p = t < 2.2 ? t / 2.2 : t < 4.2 ? 1 : t < 6.4 ? 1 - (t - 4.2) / 2.2 : 0;
      setMorph(Math.max(0, Math.min(1, p)));
      if (t < 6.4) raf.current = requestAnimationFrame(loop);
      else setAuto(false);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [auto]);

  const part = PARTS.find((p) => p.id === selected)!;

  return (
    <section id="homunculus" className="section">
      <div className="section-head">
        <span className="section-index">05 / BODY MAP IN THE BRAIN</span>
        <h2>HOMUNCULUS LAB<span className="jp-sub">脳の中の体の地図</span></h2>
        <p className="section-lead">
          脳には、体のどこに触れたかを感じ取る「体の地図」があります。地図の広さは体の大きさとは比例せず、手や唇のように、細かく感じ分けたり動かしたりする場所ほど広く描かれます。その広さに合わせて体を描き直すと、手や唇が大きく、背中が細い、少し不思議な姿になります。</p>
      </div>

      <div className="position-grid">
        <div className="position-stage homu-stage">
          <div className="position-stage-head">
            <span>{morph > 0.5 ? 'BODY IN THE BRAIN' : 'ACTUAL BODY'}</span>
            <b>{morph > 0.5 ? '脳の中の体（感覚の地図の広さで描いた体）' : '実際の体'}</b>
          </div>
          <div className="homu-canvas">
            <Canvas camera={{ position: [0, 0.35, 10.8], fov: 42 }} dpr={[1, 2]}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[4, 6, 6]} intensity={1.2} />
              <pointLight position={[-6, -2, 5]} color="#5E8BA8" intensity={25} />
              <Suspense fallback={null}>
                <Figure morph={morph} selected={selected} />
              </Suspense>
              <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 1.7} />
            </Canvas>
          </div>
          <div className="iap-drag-hint">DRAG TO ROTATE</div>
        </div>

        <div className="position-controls">
          <button className="start-btn position-main-btn" onClick={() => setAuto(true)} disabled={auto}>
            {auto ? '変形中…' : '▶ 脳の中の体に変形させる'}
          </button>
          <label className="slider-row">
            <span className="slider-name">実際の体</span>
            <input type="range" min="0" max="1" step="0.01" value={morph} onChange={(e) => { setAuto(false); setMorph(+e.target.value); }} />
            <span className="slider-name">脳の中</span>
          </label>

          <div className="region-chips" role="tablist" aria-label="部位を選ぶ">
            {PARTS.map((p) => (
              <button key={p.id} className={`chip ${selected === p.id ? 'chip-active' : ''}`} onClick={() => setSelected(p.id)}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="position-result">
            <span>脳の地図での広さ</span>
            <strong className="homu-size">{part.size}</strong>
            <p>{part.text}</p>
          </div>

          <div className="lr-howto">
            <p><b>家で試せる「2点の向き当て」</b></p>
            <ol>
              <li>クリップを広げて、2本の先の間を決めた幅（たとえば指先なら5ミリ、背中なら4センチ）にします。</li>
              <li>目を閉じてもらい、2本の先を「縦向き」か「横向き」にそろえて、皮膚に軽く当てます。</li>
              <li>縦か横かを答えてもらい、10回中何回当たるかを数えます。幅を変えて、指先と背中で比べてみましょう。</li>
</ol>
            <p className="lr-mini">「1点か2点か」を答える昔ながらの方法は、押される感じの違いなど、距離以外の手がかりでも答えられてしまうことが分かっています。向きを当てる方法のほうが、感じ分ける力をより正しく調べられます。強く押さない・とがった物を使わないでください。</p>
          </div>
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>MAP</span>
          <b>この図は「単純化した地図」</b>
          <p>体の地図は、1930年代に、目を覚ました状態で脳の手術を受けた患者さんの脳表面を電気で刺激し、どこが反応するかを調べて描かれました。実際の脳は図ほどきれいに区切られてはいません。また、手や顔が広いのは皮膚の神経の多さだけでは説明しきれず、使い方なども関わると考えられています。2023年には、すぐ前にある「運動の地図」で、手や足の領域の間に全身の動きをまとめる別の領域が挟まっていることも示されました。</p>
        </div>
        <div>
          <span>PAIN</span>
          <b>痛みと地図の関係</b>
          <p>手や足に起こる複合性局所疼痛症候群（CRPS）では、痛む手の地図が小さくなっているという結果が比較的そろっています。ただし研究の数は少なく、質にも課題があります。慢性腰痛では、触覚の鋭さが低下しているという報告はあるものの、研究の質に課題があり、地図が変わるかどうかは結果が分かれています。</p>
        </div>
        <div>
          <span>TRAINING</span>
          <b>感覚の練習で痛みは減る？</b>
          <p>触覚を感じ分ける練習を痛みのケアに取り入れる試みがあります。10件の臨床試験をまとめた報告では、慢性腰痛では結果が食い違い、ほかの痛みでは質の低い研究しかありませんでした。今のところ、効果について確かなことは言えません。</p>
        </div>
      </div>
      <p className="neuro-caution">
        参考: Penfield W, Boldrey E (1937) Brain 60:389-443／Corniani G, Saal HP (2020) Tactile innervation densities across the whole body. J Neurophysiol 124(4):1229-1240／Gordon EM ら (2023) Nature 617:351-359／Di Pietro F ら (2013) J Pain 14(10)（CRPS と一次体性感覚野）／Catley MJ ら (2014) J Pain（慢性痛と触覚の鋭さ）／Graham A ら (2022) 慢性筋骨格系疼痛への感覚識別トレーニングの系統的レビュー／Tong J ら (2013) Front Hum Neurosci（2点の向き当てと従来の2点識別）。図の大きさは説明のための目安で、実際の脳の面積の比率を正確に表すものではありません。
      </p>
    </section>
  );
}
