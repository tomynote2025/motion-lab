import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * FASCIA NETWORK — 筋膜は全身をつなぐ一枚のシート、を「動き」で体感するモデル。
 *
 * 骨格は BODY MAP と同じ BodyParts3D の全身骨格（public/models/skeleton.glb）を使い、
 * 「脚・骨盤・腰椎1〜5・上半身」に分かれたまとまりを回して前屈させる。
 *
 *   1. 選んだポイント(アキレス腱／ハムストリングス／殿筋・腰背部)が高密度化(硬さ)しているほど、
 *      股関節が曲がらず前屈が浅くなる(可動域制限)
 *   2. 股関節が曲がらない分、腰椎が過剰に丸まって代償する → 腰にストレスが集中する
 *
 * 「下肢後面全体が均等に硬い」という単一パターンにならないよう、線維のラインを3区間に分け、
 * 選んだポイントの区間だけが強く張力を受けるようにしている。
 */

const MODEL_URL = '/models/skeleton.glb';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// BODY MAP と同じ配色
const BONE_COLOR = '#ddd6c4';
const ACCENT = '#5E8BA8';
const ACTIVE = '#C0562F';

type Vec3 = [number, number, number];
export type DensityPointId = 'achilles' | 'hamstring' | 'glute';

/** 骨格の座標（BodyParts3D を縮小したもの。前 = +Z、+X = 体の左。後ろ側は -Z） */
const HIP: Vec3 = [0, 0.277, -0.076]; // 股関節（大腿骨頭）の高さ。骨盤から上はここを軸に回る
const LUMBAR_BOTTOM = 0.637; // 第5腰椎の下
const LUMBAR_STEP = 0.136; // 腰椎1つ分の高さ
const SPINE_Z = -0.113; // 椎体の前後位置

export const DENSITY_POINTS: { id: DensityPointId; label: string; at: Vec3; range: [number, number]; onPelvis?: boolean }[] = [
  { id: 'achilles', label: 'アキレス腱・ふくらはぎ', at: [0.27, -2.45, -0.36], range: [0, 0.36] },
  { id: 'hamstring', label: 'ハムストリングス', at: [0.33, -0.9, -0.29], range: [0.3, 0.74] },
  { id: 'glute', label: '殿筋・腰背部', at: [0.2, 0.5, -0.36], range: [0.68, 1], onPelvis: true },
];

function lerpColor(a: string, b: string, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1));
}

/** pivot を軸に angle(ラジアン)だけ前へ倒した点 */
function rotateAround(p: THREE.Vector3, pivot: Vec3, angle: number) {
  const y = p.y - pivot[1];
  const z = p.z - pivot[2];
  return new THREE.Vector3(p.x, pivot[1] + y * Math.cos(angle) - z * Math.sin(angle), pivot[2] + y * Math.sin(angle) + z * Math.cos(angle));
}

/** pivot を軸に、子どもを angle だけ回すグループ（子どもは骨格の座標のまま置ける） */
function Pivot({ at, angle, children }: { at: Vec3; angle: number; children: React.ReactNode }) {
  return (
    <group position={at} rotation={[angle, 0, 0]}>
      <group position={[-at[0], -at[1], -at[2]]}>{children}</group>
    </group>
  );
}

/** 骨格のまとまり（glb のノード名: legs / pelvis / L1〜L5 / upper） */
function useSkeletonParts() {
  const { nodes } = useGLTF(MODEL_URL) as unknown as { nodes: Record<string, THREE.Object3D> };
  return nodes;
}

/** まとまり1つを描く。材質が複数あるまとまり(上半身など)は、材質ごとのメッシュの集まりになっている */
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

/** 腰椎。ストレスが強いほどオレンジに光って代償を示す */
function useLumbarMaterial(strain: number) {
  const color = lerpColor(BONE_COLOR, ACTIVE, strain);
  return useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: strain * 1.1, roughness: 0.5, metalness: 0.05 }),
    [color.getHexString(), strain],
  );
}

/** クリックで選べるホットスポット(BODY MAP と同じ見た目・挙動) */
function DensityHotspot({
  point,
  active,
  onSelect,
}: {
  point: (typeof DENSITY_POINTS)[number];
  active: boolean;
  onSelect: (id: DensityPointId) => void;
}) {
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
    <group position={point.at}>
      <mesh
        ref={dotRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(point.id);
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

/** ハムストリングスのライン（かかと → ふくらはぎ → ひざ裏 → 太もも裏 → 坐骨 → 殿部） */
const HAM_LINE_POINTS: Vec3[] = [
  [0.265, -2.8, -0.4],
  [0.29, -2.05, -0.33],
  [0.31, -1.28, -0.25],
  [0.32, -0.52, -0.28],
  [0.2, 0.13, -0.24],
  [0.17, 0.52, -0.34],
];
const FIBER_COUNT = 4;
const FIBER_SEGMENTS = 24;

function segmentCurve(base: THREE.CatmullRomCurve3, range: [number, number]) {
  const steps = 16;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    pts.push(base.getPoint(lerp(range[0], range[1], i / steps)));
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** エラスチン線維1本。緩んでいる(tension低い)ときは波打ってゆとりがあり、
 * 張力がかかる(tension高い)ほど1本にピンと伸びて細かく震え、太くオレンジに発光する。 */
function ElasticFiber({ curve, tension, angle, phase }: { curve: THREE.CatmullRomCurve3; tension: number; angle: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.TubeGeometry | null>(null);
  const timeRef = useRef(0);

  const color = lerpColor(ACCENT, ACTIVE, tension);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 + tension * 0.75, roughness: 0.32, metalness: 0.05 }),
    [color.getHexString(), tension],
  );

  const ox = Math.cos(angle) * 0.026;
  const oz = Math.sin(angle) * 0.026;
  const r = lerp(0.013, 0.023, tension) * lerp(1, 0.82, tension);

  const buildGeometry = (wobble: number, jitter: number) => {
    const pts = curve.getPoints(FIBER_SEGMENTS).map((p, i) => {
      const t = i / FIBER_SEGMENTS;
      const bulge = Math.sin(t * Math.PI);
      const wob = Math.sin(t * Math.PI * 4 + phase) * wobble * bulge;
      const jt = jitter ? (Math.random() - 0.5) * jitter * bulge : 0;
      return new THREE.Vector3(p.x + ox + wob * Math.cos(angle) + jt, p.y, p.z + oz + wob * Math.sin(angle) + jt);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), FIBER_SEGMENTS, r, 6, false);
  };

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const wobble = lerp(0.045, 0.006, tension);
    const jitter = tension > 0.35 ? (tension - 0.35) * 0.012 * (0.5 + 0.5 * Math.sin(timeRef.current * 40 + phase * 5)) : 0;
    const geo = buildGeometry(wobble, jitter);
    if (geoRef.current) geoRef.current.dispose();
    ref.current.geometry = geo;
    geoRef.current = geo;
  });

  return <mesh ref={ref} material={mat} />;
}

/** 3区間(アキレス腱／ハムストリングス／殿筋)に分けたライン。
 * 選んだ区間だけ強く張力を受け、それ以外はほぼ健康な状態のままにする。 */
function HamstringLine({ selectedPoint, tension, hipAngle }: { selectedPoint: DensityPointId; tension: number; hipAngle: number }) {
  // 坐骨より上（骨盤についている端）は、前屈で骨盤と一緒に動く
  const base = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        HAM_LINE_POINTS.map((p, i) => {
          const v = new THREE.Vector3(...p);
          return i >= HAM_LINE_POINTS.length - 2 ? rotateAround(v, HIP, hipAngle) : v;
        }),
      ),
    [hipAngle],
  );
  return (
    <group>
      {DENSITY_POINTS.map((point) => {
        const curve = segmentCurve(base, point.range);
        const segTension = point.id === selectedPoint ? tension : tension * 0.1;
        return (
          <group key={point.id}>
            {Array.from({ length: FIBER_COUNT }).map((_, i) => (
              <ElasticFiber key={i} curve={curve} tension={segTension} angle={(i / FIBER_COUNT) * Math.PI * 2} phase={i * 1.7} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** 股関節の可動限界マーカー。制限にぶつかっているときだけリングが浮かび上がる */
function JointLimitRing({ at, intensity }: { at: Vec3; intensity: number }) {
  const color = ACTIVE;
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.75 + Math.sin(clock.elapsedTime * 5) * 0.25;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = intensity * pulse * 0.85;
    const s = 1 + (1 - pulse) * 0.15 * intensity;
    ref.current.scale.setScalar(s);
  });
  if (intensity <= 0.01) return null;
  return (
    <mesh ref={ref} position={at} rotation={[Math.PI / 2, 0.3, 0]} material={mat}>
      <ringGeometry args={[0.19, 0.245, 28]} />
    </mesh>
  );
}

export function FasciaNetworkModel({
  densification,
  bendProgress,
  selectedPoint,
  onSelectPoint,
}: {
  /** 0=柔らかい(健康) 〜 1=高密度化(硬い) */
  densification: number;
  /** 0=直立 〜 1=前屈しきった状態 */
  bendProgress: number;
  /** 今どの部位を「詰まりのポイント」として選んでいるか */
  selectedPoint: DensityPointId;
  onSelectPoint: (id: DensityPointId) => void;
}) {
  const nodes = useSkeletonParts();
  const maxHipDeg = lerp(80, 22, densification);
  const maxLumbarDeg = lerp(5, 38, densification);

  const hipAngle = (bendProgress * maxHipDeg * Math.PI) / 180;
  const lumbarAngle = (bendProgress * maxLumbarDeg * Math.PI) / 180;

  const tension = clamp(bendProgress * (0.3 + densification * 0.7), 0, 1);
  const lumbarStrain = clamp((lumbarAngle / ((38 * Math.PI) / 180)) * bendProgress, 0, 1);
  const hipLimitHit = clamp((bendProgress - 0.25) / 0.75, 0, 1) * densification;
  const lumbarMat = useLumbarMaterial(lumbarStrain);

  // 腰椎は5つに分けて少しずつ曲げる（下の第5腰椎から順に積み重ねる）
  const seg = lumbarAngle / 5;
  const pivotAt = (i: number): Vec3 => [0, LUMBAR_BOTTOM + LUMBAR_STEP * i, SPINE_Z];
  const fixedPoints = DENSITY_POINTS.filter((p) => !p.onPelvis);
  const pelvisPoints = DENSITY_POINTS.filter((p) => p.onPelvis);

  return (
    <group rotation={[0, 0.5, 0]} position={[0, -0.1, 0]}>
      <Part mesh={nodes.legs} />
      <JointLimitRing at={[0.333, HIP[1], HIP[2]]} intensity={hipLimitHit} />
      <JointLimitRing at={[-0.333, HIP[1], HIP[2]]} intensity={hipLimitHit} />

      {fixedPoints.map((point) => (
        <DensityHotspot key={point.id} point={point} active={selectedPoint === point.id} onSelect={onSelectPoint} />
      ))}

      <Pivot at={HIP} angle={hipAngle}>
        <Part mesh={nodes.pelvis} />
        {pelvisPoints.map((point) => (
          <DensityHotspot key={point.id} point={point} active={selectedPoint === point.id} onSelect={onSelectPoint} />
        ))}
        <Pivot at={pivotAt(0)} angle={seg}>
          <Part mesh={nodes.L5} material={lumbarMat} />
          <Pivot at={pivotAt(1)} angle={seg}>
            <Part mesh={nodes.L4} material={lumbarMat} />
            <Pivot at={pivotAt(2)} angle={seg}>
              <Part mesh={nodes.L3} material={lumbarMat} />
              <Pivot at={pivotAt(3)} angle={seg}>
                <Part mesh={nodes.L2} material={lumbarMat} />
                <Pivot at={pivotAt(4)} angle={seg}>
                  <Part mesh={nodes.L1} material={lumbarMat} />
                  <Pivot at={pivotAt(5)} angle={seg}>
                    <Part mesh={nodes.upper} />
                  </Pivot>
                </Pivot>
              </Pivot>
            </Pivot>
          </Pivot>
        </Pivot>
      </Pivot>

      <HamstringLine selectedPoint={selectedPoint} tension={tension} hipAngle={hipAngle} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
