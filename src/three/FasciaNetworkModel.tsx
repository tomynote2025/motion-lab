import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * FASCIA NETWORK — 筋膜は全身をつなぐ一枚のシート、を「動き」で体感するモデル。
 *
 * 骨格は BODY MAP と同じ BodyParts3D の全身骨格（public/models/skeleton.glb）を使い、
 * 「脚・骨盤・腰椎1〜5・胸郭・左右の腕・頸椎3〜7・頭」に分かれたまとまりを回して動かす。
 *
 * 高密度化(硬さ)の場所と、動きが制限されて負担が集まる場所が「離れている」3パターン:
 *   leg     太もも裏 → 前屈が浅くなり、股関節の代わりに腰が丸まる（腰に負担）
 *   abdomen おなか   → 腕が上まで上がらず、肩に負担が集まる（腰を反らせて補う）
 *   arm     二の腕   → 首を反対側へ倒しにくく、首に負担が集まる
 * 硬い場所から負担の集まる場所まで、筋膜のライン（線維）を引いて、張力のかかり方を見せる。
 */

const MODEL_URL = '/models/skeleton.glb';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

// BODY MAP と同じ配色
const BONE_COLOR = '#ddd6c4';
const ACCENT = '#5E8BA8';
const ACTIVE = '#C0562F';

type Vec3 = [number, number, number];
export type FasciaPattern = 'leg' | 'abdomen' | 'arm';

/** 骨格の座標（BodyParts3D を縮小したもの。前 = +Z、+X = 体の左。後ろ側は -Z） */
const HIP: Vec3 = [0, 0.277, -0.076]; // 股関節（大腿骨頭）の高さ。骨盤から上はここを軸に回る
const LUMBAR_BOTTOM = 0.637; // 第5腰椎の下
const LUMBAR_STEP = 0.136; // 腰椎1つ分の高さ
const SPINE_Z = -0.113; // 椎体の前後位置
const SHOULDER_L: Vec3 = [0.64, 2.17, -0.08]; // 上腕骨頭の中心
const SHOULDER_R: Vec3 = [-0.64, 2.17, -0.08];
/** 頸椎の回る位置（下から 第7・6・5・4・3頸椎、頭＝第2頸椎より上） */
const NECK_PIVOTS: Vec3[] = [2.374, 2.437, 2.483, 2.525, 2.573, 2.64].map((y) => [0, y, -0.12]);
const LUMBAR_PIVOTS: Vec3[] = [0, 1, 2, 3, 4, 5].map((i) => [0, LUMBAR_BOTTOM + LUMBAR_STEP * i, SPINE_Z]);

/** 骨のまとまり。線や光る点をどのまとまりに付けるか */
type Seg = 'legs' | 'pelvis' | 'thorax' | 'armL' | 'head';

/** 姿勢（ラジアン）。lumbarSeg・neckSeg は1か所あたりの角度 */
type Pose = { hip: number; lumbarSeg: number; shoulder: number; neckSeg: number };

/** 筋膜のライン。点の並びと、それぞれが付いているまとまり。hot = 光る点（硬い場所）の番号 */
const LINES: Record<FasciaPattern, { pts: Vec3[]; segs: Seg[]; hot: number }> = {
  // かかと → ふくらはぎ → ひざ裏 → 太もも裏 → 坐骨 → 殿部
  leg: {
    pts: [
      [0.265, -2.8, -0.4],
      [0.29, -2.05, -0.33],
      [0.31, -1.28, -0.25],
      [0.32, -0.52, -0.28],
      [0.2, 0.13, -0.24],
      [0.17, 0.52, -0.34],
    ],
    segs: ['legs', 'legs', 'legs', 'legs', 'pelvis', 'pelvis'],
    hot: 3,
  },
  // 恥骨 → おなか → 肋骨の前 → 胸（大胸筋） → 上腕の前 → ひじの前
  abdomen: {
    pts: [
      [0.06, 0.25, 0.17],
      [0.09, 0.62, 0.33],
      [0.1, 1.05, 0.41],
      [0.13, 1.45, 0.45],
      [0.32, 1.95, 0.4],
      [0.6, 2.02, 0.1],
      [0.69, 1.62, 0.04],
      [0.79, 1.22, 0.02],
    ],
    segs: ['pelvis', 'pelvis', 'thorax', 'thorax', 'thorax', 'armL', 'armL', 'armL'],
    hot: 2,
  },
  // 前腕の後ろ → ひじ → 二の腕 → 肩の上 → 首の付け根 → 首の横 → 後頭部
  arm: {
    pts: [
      [0.95, 0.75, -0.12],
      [0.86, 1.15, -0.2],
      [0.77, 1.65, -0.17],
      [0.6, 2.32, -0.12],
      [0.32, 2.5, -0.22],
      [0.13, 2.75, -0.2],
      [0.08, 3.0, -0.36],
    ],
    segs: ['armL', 'armL', 'armL', 'thorax', 'thorax', 'head', 'head'],
    hot: 2,
  },
};

const PATTERN_IDS: FasciaPattern[] = ['leg', 'abdomen', 'arm'];

/** パターンごとの見る向き（体の左側から見て、前屈・腕は横から、首は前から） */
const VIEW_ROTATION: Record<FasciaPattern, number> = { leg: -1.15, abdomen: -0.95, arm: -0.3 };
/** 腕を上げるパターンは手が頭より上に出るので、体を少し下げて画面に収める */
const VIEW_Y: Record<FasciaPattern, number> = { leg: -0.1, abdomen: -0.85, arm: -0.1 };

function lerpColor(a: string, b: string, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1));
}

/** pivot を通る左右の軸で angle だけ回す（+ で前へ倒れる） */
function rotX(p: THREE.Vector3, pivot: Vec3, angle: number) {
  const y = p.y - pivot[1];
  const z = p.z - pivot[2];
  return new THREE.Vector3(p.x, pivot[1] + y * Math.cos(angle) - z * Math.sin(angle), pivot[2] + y * Math.sin(angle) + z * Math.cos(angle));
}

/** pivot を通る前後の軸で angle だけ回す（+ で体の右へ倒れる） */
function rotZ(p: THREE.Vector3, pivot: Vec3, angle: number) {
  const x = p.x - pivot[0];
  const y = p.y - pivot[1];
  return new THREE.Vector3(pivot[0] + x * Math.cos(angle) - y * Math.sin(angle), pivot[1] + x * Math.sin(angle) + y * Math.cos(angle), p.z);
}

/** 骨格の座標の点を、姿勢に合わせて動かす（下の Pivot の入れ子と同じ順に回す） */
function place(p: Vec3, seg: Seg, pose: Pose) {
  let v = new THREE.Vector3(...p);
  if (seg === 'legs') return v;
  if (seg === 'armL') v = rotX(v, SHOULDER_L, pose.shoulder);
  if (seg === 'head') for (let i = NECK_PIVOTS.length - 1; i >= 0; i--) v = rotZ(v, NECK_PIVOTS[i], pose.neckSeg);
  if (seg !== 'pelvis') for (let i = LUMBAR_PIVOTS.length - 1; i >= 0; i--) v = rotX(v, LUMBAR_PIVOTS[i], pose.lumbarSeg);
  return rotX(v, HIP, pose.hip);
}

/** pivot を軸に、子どもを回すグループ（子どもは骨格の座標のまま置ける）。axis='z' は横に倒す */
function Pivot({ at, angle, axis = 'x', children }: { at: Vec3; angle: number; axis?: 'x' | 'z'; children: React.ReactNode }) {
  return (
    <group position={at} rotation={axis === 'x' ? [angle, 0, 0] : [0, 0, angle]}>
      <group position={[-at[0], -at[1], -at[2]]}>{children}</group>
    </group>
  );
}

/** 骨格のまとまり（glb のノード名: legs / pelvis / L1〜L5 / thorax / armL / armR / C3〜C7 / head） */
function useSkeletonParts() {
  const { nodes } = useGLTF(MODEL_URL) as unknown as { nodes: Record<string, THREE.Object3D> };
  return nodes;
}

/** まとまり1つを描く。材質が複数あるまとまり(胸郭・頭など)は、材質ごとのメッシュの集まりになっている */
function Part({ mesh, material }: { mesh: THREE.Object3D; material?: THREE.Material }) {
  const meshes = (mesh as THREE.Mesh).isMesh ? [mesh as THREE.Mesh] : (mesh.children.filter((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh[]);
  return (
    <>
      {meshes.map((m) => (
        <mesh key={m.uuid} geometry={m.geometry} material={material ?? m.material} raycast={() => null} />
      ))}
    </>
  );
}

/** 負担が集まる骨（腰椎・頸椎）。負担が強いほどオレンジに光る */
function useStrainMaterial(strain: number) {
  const color = lerpColor(BONE_COLOR, ACTIVE, strain);
  return useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: strain * 1.1, roughness: 0.5, metalness: 0.05 }),
    [color.getHexString(), strain],
  );
}

/** クリックで選べるホットスポット(BODY MAP と同じ見た目・挙動) */
function DensityHotspot({ at, active, onSelect }: { at: THREE.Vector3; active: boolean; onSelect: () => void }) {
  const dotRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = active ? ACTIVE : ACCENT;

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime * 2.2;
    const pulse = 1 + Math.sin(t) * 0.14;
    dotRef.current?.scale.setScalar(active ? 1.5 : pulse);
    if (ringRef.current) {
      ringRef.current.lookAt(camera.position);
      ringRef.current.scale.setScalar(active ? 1.9 : 1.3 + Math.sin(t) * 0.18);
    }
  });

  return (
    <group position={at}>
      <mesh
        ref={dotRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.5 : 0.85} roughness={0.3} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.105, 0.13, 28]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const FIBER_COUNT = 4;
const FIBER_SEGMENTS = 28;

/** エラスチン線維1本。緩んでいる(tension低い)ときは波打ってゆとりがあり、
 * 張力がかかる(tension高い)ほど1本にピンと伸びて細かく震え、太くオレンジに発光する。 */
function ElasticFiber({ curve, tension, angle, phase }: { curve: THREE.CatmullRomCurve3; tension: number; angle: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.TubeGeometry | null>(null);
  const timeRef = useRef(0);
  const curveRef = useRef(curve);
  curveRef.current = curve;

  const color = lerpColor(ACCENT, ACTIVE, tension);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 + tension * 0.75, roughness: 0.32, metalness: 0.05 }),
    [color.getHexString(), tension],
  );

  const ox = Math.cos(angle) * 0.026;
  const oz = Math.sin(angle) * 0.026;
  const r = lerp(0.013, 0.023, tension) * lerp(1, 0.82, tension);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const wobble = lerp(0.045, 0.006, tension);
    const jitter = tension > 0.35 ? (tension - 0.35) * 0.012 * (0.5 + 0.5 * Math.sin(timeRef.current * 40 + phase * 5)) : 0;
    const pts = curveRef.current.getPoints(FIBER_SEGMENTS).map((p, i) => {
      const t = i / FIBER_SEGMENTS;
      const bulge = Math.sin(t * Math.PI);
      const wob = Math.sin(t * Math.PI * 4 + phase) * wobble * bulge;
      const jt = jitter ? (Math.random() - 0.5) * jitter * bulge : 0;
      return new THREE.Vector3(p.x + ox + wob * Math.cos(angle) + jt, p.y, p.z + oz + wob * Math.sin(angle) + jt);
    });
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), FIBER_SEGMENTS, r, 6, false);
    if (geoRef.current) geoRef.current.dispose();
    ref.current.geometry = geo;
    geoRef.current = geo;
  });

  return <mesh ref={ref} material={mat} />;
}

/** 筋膜のライン1本（線維4本の束） */
function FasciaLine({ points, tension }: { points: THREE.Vector3[]; tension: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  return (
    <group>
      {Array.from({ length: FIBER_COUNT }).map((_, i) => (
        <ElasticFiber key={i} curve={curve} tension={tension} angle={(i / FIBER_COUNT) * Math.PI * 2} phase={i * 1.7} />
      ))}
    </group>
  );
}

/** 関節の可動限界マーカー。制限にぶつかっているときだけリングが浮かび上がる */
function JointLimitRing({ at, intensity, rotation = [Math.PI / 2, 0.3, 0] }: { at: Vec3; intensity: number; rotation?: Vec3 }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: ACTIVE, transparent: true, opacity: 0, side: THREE.DoubleSide }), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.75 + Math.sin(clock.elapsedTime * 5) * 0.25;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = intensity * pulse * 0.85;
    ref.current.scale.setScalar(1 + (1 - pulse) * 0.15 * intensity);
  });
  if (intensity <= 0.01) return null;
  return (
    <mesh ref={ref} position={at} rotation={rotation} material={mat}>
      <ringGeometry args={[0.19, 0.245, 28]} />
    </mesh>
  );
}

/** 負担が集まる関節（肩）を、脈打つオレンジの光で示す */
function StrainGlow({ at, intensity }: { at: Vec3; intensity: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7a45', transparent: true, opacity: 0, depthWrite: false, depthTest: false }), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.7 + Math.sin(clock.elapsedTime * 5) * 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = intensity * pulse * 0.7;
    ref.current.scale.setScalar(1 + pulse * 0.25 * intensity);
  });
  if (intensity <= 0.01) return null;
  return (
    <mesh ref={ref} position={at} material={mat}>
      <sphereGeometry args={[0.17, 20, 20]} />
    </mesh>
  );
}

/** 選んだパターンの見る向きへ、なめらかに回る */
function ViewTurn({ pattern, children }: { pattern: FasciaPattern; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = Math.min(1, delta * 4);
    ref.current.rotation.y += (VIEW_ROTATION[pattern] - ref.current.rotation.y) * k;
    ref.current.position.y += (VIEW_Y[pattern] - ref.current.position.y) * k;
  });
  return (
    <group ref={ref} rotation={[0, VIEW_ROTATION[pattern], 0]} position={[0, VIEW_Y[pattern], 0]}>
      {children}
    </group>
  );
}

export function FasciaNetworkModel({
  pattern,
  densification,
  progress,
  onSelectPattern,
}: {
  /** どこが硬いか（硬い場所と、動きが制限される場所の組み合わせ） */
  pattern: FasciaPattern;
  /** 0=柔らかい(健康) 〜 1=高密度化(硬い) */
  densification: number;
  /** 0=はじめの姿勢 〜 1=動かしきった状態 */
  progress: number;
  onSelectPattern: (id: FasciaPattern) => void;
}) {
  const nodes = useSkeletonParts();
  const d = densification;
  const p = progress;

  // パターンごとの動き。硬いほど目的の関節が動かず、負担が別の場所に集まる
  let hipDeg = 0;
  let lumbarDeg = 0; // + 丸める / − 反らす
  let shoulderDeg = 0; // − 腕を前から上げる
  let neckDeg = 0; // + 首を右へ倒す（左腕から離れる向き）
  let lumbarStrain = 0;
  let neckStrain = 0;
  let shoulderStrain = 0;
  let hipLimit = 0;
  if (pattern === 'leg') {
    hipDeg = p * lerp(80, 22, d);
    lumbarDeg = p * lerp(5, 38, d);
    lumbarStrain = clamp((lumbarDeg / 38) * p, 0, 1);
    hipLimit = clamp((p - 0.25) / 0.75, 0, 1) * d;
    shoulderDeg = -(hipDeg + lumbarDeg * 1.2); // 腕は重力で下に垂れたまま
  } else if (pattern === 'abdomen') {
    shoulderDeg = -p * lerp(170, 90, d);
    lumbarDeg = -p * lerp(2, 14, d);
    shoulderStrain = clamp(p * (d - 0.15) * 1.4, 0, 1);
  } else {
    neckDeg = p * lerp(42, 14, d);
    neckStrain = clamp(p * (d - 0.15) * 1.4, 0, 1);
  }

  const pose: Pose = { hip: rad(hipDeg), lumbarSeg: rad(lumbarDeg) / 5, shoulder: rad(shoulderDeg), neckSeg: rad(neckDeg) / NECK_PIVOTS.length };
  const tension = clamp(p * (0.3 + d * 0.7), 0, 1);
  const lumbarMat = useStrainMaterial(lumbarStrain);
  const neckMat = useStrainMaterial(neckStrain);

  const lines = useMemo(() => {
    const out = {} as Record<FasciaPattern, THREE.Vector3[]>;
    for (const id of PATTERN_IDS) out[id] = LINES[id].pts.map((pt, i) => place(pt, LINES[id].segs[i], pose));
    return out;
  }, [pose.hip, pose.lumbarSeg, pose.shoulder, pose.neckSeg]);

  const L = LUMBAR_PIVOTS;
  const N = NECK_PIVOTS;
  const shoulderAt = (s: Vec3): Vec3 => [s[0] * 1.02, s[1], s[2]];

  return (
    <ViewTurn pattern={pattern}>
      <Part mesh={nodes.legs} />
      <JointLimitRing at={[0.333, HIP[1], HIP[2]]} intensity={hipLimit} />
      <JointLimitRing at={[-0.333, HIP[1], HIP[2]]} intensity={hipLimit} />

      <Pivot at={HIP} angle={pose.hip}>
        <Part mesh={nodes.pelvis} />
        <Pivot at={L[0]} angle={pose.lumbarSeg}>
          <Part mesh={nodes.L5} material={lumbarMat} />
          <Pivot at={L[1]} angle={pose.lumbarSeg}>
            <Part mesh={nodes.L4} material={lumbarMat} />
            <Pivot at={L[2]} angle={pose.lumbarSeg}>
              <Part mesh={nodes.L3} material={lumbarMat} />
              <Pivot at={L[3]} angle={pose.lumbarSeg}>
                <Part mesh={nodes.L2} material={lumbarMat} />
                <Pivot at={L[4]} angle={pose.lumbarSeg}>
                  <Part mesh={nodes.L1} material={lumbarMat} />
                  <Pivot at={L[5]} angle={pose.lumbarSeg}>
                    <Part mesh={nodes.thorax} />
                    <StrainGlow at={shoulderAt(SHOULDER_L)} intensity={shoulderStrain} />
                    <StrainGlow at={shoulderAt(SHOULDER_R)} intensity={shoulderStrain} />
                    <Pivot at={SHOULDER_L} angle={pose.shoulder}>
                      <Part mesh={nodes.armL} />
                    </Pivot>
                    <Pivot at={SHOULDER_R} angle={pose.shoulder}>
                      <Part mesh={nodes.armR} />
                    </Pivot>
                    <Pivot at={N[0]} angle={pose.neckSeg} axis="z">
                      <Part mesh={nodes.C7} material={neckMat} />
                      <Pivot at={N[1]} angle={pose.neckSeg} axis="z">
                        <Part mesh={nodes.C6} material={neckMat} />
                        <Pivot at={N[2]} angle={pose.neckSeg} axis="z">
                          <Part mesh={nodes.C5} material={neckMat} />
                          <Pivot at={N[3]} angle={pose.neckSeg} axis="z">
                            <Part mesh={nodes.C4} material={neckMat} />
                            <Pivot at={N[4]} angle={pose.neckSeg} axis="z">
                              <Part mesh={nodes.C3} material={neckMat} />
                              <Pivot at={N[5]} angle={pose.neckSeg} axis="z">
                                <Part mesh={nodes.head} />
                              </Pivot>
                            </Pivot>
                          </Pivot>
                        </Pivot>
                      </Pivot>
                    </Pivot>
                  </Pivot>
                </Pivot>
              </Pivot>
            </Pivot>
          </Pivot>
        </Pivot>
      </Pivot>

      {/* ラインは選んだパターンの1本だけ。ほかのパターンは、止まっているときだけ光る点で選べるようにする */}
      <FasciaLine points={lines[pattern]} tension={tension} />
      {PATTERN_IDS.filter((id) => id === pattern || p === 0).map((id) => (
        <DensityHotspot key={id} at={lines[id][LINES[id].hot]} active={id === pattern} onSelect={() => onSelectPattern(id)} />
      ))}
    </ViewTurn>
  );
}

useGLTF.preload(MODEL_URL);
