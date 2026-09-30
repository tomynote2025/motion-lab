import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * FASCIA NETWORK — 筋膜は全身をつなぐ一枚のシート、を「動き」で体感するモデル。
 *
 * BODY MAP(SkeletonModel.tsx)と同じ色・マテリアル・パーツの組み方(カプセル+球のジョイント)
 * に統一し、サイト全体のトーンから浮かないようにしている。
 *
 *   1. 選んだポイント(アキレス腱／ハムストリングス／殿筋・腰背部)が高密度化(硬さ)しているほど、
 *      股関節が曲がらず前屈が浅くなる(可動域制限)
 *   2. 股関節が曲がらない分、腰椎が過剰に丸まって代償する → 腰にストレスが集中する(代償による痛みの土台)
 *
 * 「下肢後面全体が均等に硬い」という単一パターンにならないよう、線維のラインを3区間に分け、
 * 選んだポイントの区間だけが強く張力を受けるようにしている。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// BODY MAP(SkeletonModel.tsx)と完全に同じ配色に統一
const BONE_COLOR = '#ddd6c4';
const ACCENT = '#5E8BA8';
const ACTIVE = '#C0562F';

type Vec3 = [number, number, number];
export type DensityPointId = 'achilles' | 'hamstring' | 'glute';

export const DENSITY_POINTS: { id: DensityPointId; label: string; at: Vec3; range: [number, number] }[] = [
  { id: 'achilles', label: 'アキレス腱・ふくらはぎ', at: [0.47, -2.45, 0.16], range: [0, 0.36] },
  { id: 'hamstring', label: 'ハムストリングス', at: [0.42, -1.05, -0.1], range: [0.3, 0.74] },
  { id: 'glute', label: '殿筋・腰背部', at: [0.26, -0.12, -0.2], range: [0.68, 1] },
];

const boneMaterial = new THREE.MeshStandardMaterial({
  color: BONE_COLOR,
  roughness: 0.55,
  metalness: 0.05,
});

function lerpColor(a: string, b: string, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1));
}

function Bone({ from, to, r, material }: { from: Vec3; to: Vec3; r: number; material?: THREE.Material }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length() - r * 1.2, 0.05);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: a.clone().lerp(b, 0.5), quat, len };
  }, [from[0], from[1], from[2], to[0], to[1], to[2], r]);
  return (
    <mesh position={pos} quaternion={quat} material={material ?? boneMaterial}>
      <capsuleGeometry args={[r, len, 6, 14]} />
    </mesh>
  );
}

function Joint({ at, r, material }: { at: Vec3; r: number; material?: THREE.Material }) {
  return (
    <mesh position={at} material={material ?? boneMaterial}>
      <sphereGeometry args={[r, 18, 18]} />
    </mesh>
  );
}

function Rib({ y, rx }: { y: number; rx: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]} material={boneMaterial}>
      <torusGeometry args={[rx, 0.045, 10, 40]} />
    </mesh>
  );
}

/** 骨盤・脚(固定、回転しない部分)。座標は BODY MAP と揃えている */
function LowerBody() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2.4, 0, 0]} scale={[1, 0.8, 1]} material={boneMaterial}>
        <torusGeometry args={[0.42, 0.11, 12, 30]} />
      </mesh>
      <mesh position={[0, -0.02, -0.12]} rotation={[0.5, 0, 0]} material={boneMaterial}>
        <boxGeometry args={[0.26, 0.34, 0.14]} />
      </mesh>

      <Joint at={[0.45, -0.18, 0]} r={0.14} />
      <Joint at={[-0.45, -0.18, 0]} r={0.14} />
      <Bone from={[0.45, -0.18, 0]} to={[0.47, -1.55, 0]} r={0.19} />
      <Bone from={[-0.45, -0.18, 0]} to={[-0.47, -1.55, 0]} r={0.19} />
      <Joint at={[0.47, -1.55, 0]} r={0.13} />
      <Joint at={[-0.47, -1.55, 0]} r={0.13} />
      <Bone from={[0.47, -1.55, 0]} to={[0.47, -2.85, 0]} r={0.09} />
      <Bone from={[-0.47, -1.55, 0]} to={[-0.47, -2.85, 0]} r={0.09} />
      <mesh position={[0.47, -2.98, 0.18]} material={boneMaterial}>
        <boxGeometry args={[0.22, 0.12, 0.52]} />
      </mesh>
      <mesh position={[-0.47, -2.98, 0.18]} material={boneMaterial}>
        <boxGeometry args={[0.22, 0.12, 0.52]} />
      </mesh>
    </group>
  );
}

/** 腰椎(骨盤のすぐ上〜胸郭の下)。ストレスが強いほどオレンジに発光して代償を示す */
function LumbarSegment({ strain }: { strain: number }) {
  const color = lerpColor(BONE_COLOR, ACTIVE, strain);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: strain * 1.2, roughness: 0.5, metalness: 0.05 }),
    [color.getHexString(), strain],
  );
  return (
    <group>
      {[0.28, 0.52, 0.76, 1.0].map((y, i) => (
        <mesh key={i} position={[0, y, i < 2 ? -0.04 : 0]} material={mat}>
          <cylinderGeometry args={[0.13, 0.13, 0.17, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/** 胸郭より上(頸椎・胸郭・肩・腕・頭)。座標は BODY MAP と揃えている */
function UpperBody() {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 1.35 + i * 0.245, i < 3 ? -0.06 : 0]} material={boneMaterial}>
          <cylinderGeometry args={[0.11, 0.11, 0.15, 12]} />
        </mesh>
      ))}

      <Rib y={2.1} rx={0.5} />
      <Rib y={1.92} rx={0.6} />
      <Rib y={1.72} rx={0.66} />
      <Rib y={1.52} rx={0.64} />
      <Rib y={1.32} rx={0.56} />
      <mesh position={[0, 1.75, 0.44]} material={boneMaterial}>
        <boxGeometry args={[0.14, 0.72, 0.06]} />
      </mesh>

      <mesh position={[0, 2.95, 0]} scale={[0.86, 1, 0.92]} material={boneMaterial}>
        <sphereGeometry args={[0.46, 24, 24]} />
      </mesh>
      <mesh position={[0, 2.6, 0.1]} material={boneMaterial}>
        <boxGeometry args={[0.34, 0.26, 0.32]} />
      </mesh>

      <Bone from={[0.1, 2.12, 0.3]} to={[0.78, 2.05, 0]} r={0.05} />
      <Bone from={[-0.1, 2.12, 0.3]} to={[-0.78, 2.05, 0]} r={0.05} />
      <Joint at={[0.78, 2.05, 0]} r={0.15} />
      <Joint at={[-0.78, 2.05, 0]} r={0.15} />
      <Bone from={[0.78, 2.05, 0]} to={[0.98, 1.12, 0]} r={0.075} />
      <Bone from={[-0.78, 2.05, 0]} to={[-0.98, 1.12, 0]} r={0.075} />
      <Joint at={[0.98, 1.12, 0]} r={0.11} />
      <Joint at={[-0.98, 1.12, 0]} r={0.11} />
      <Bone from={[0.98, 1.12, 0]} to={[1.1, 0.22, 0.06]} r={0.06} />
      <Bone from={[-0.98, 1.12, 0]} to={[-1.1, 0.22, 0.06]} r={0.06} />
      <mesh position={[1.12, 0.02, 0.08]} scale={[1, 1.4, 0.6]} material={boneMaterial}>
        <sphereGeometry args={[0.12, 14, 14]} />
      </mesh>
      <mesh position={[-1.12, 0.02, 0.08]} scale={[1, 1.4, 0.6]} material={boneMaterial}>
        <sphereGeometry args={[0.12, 14, 14]} />
      </mesh>
    </group>
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

/** ハムストリングスライン全体の経路(足首 → 坐骨) */
const HAM_LINE_POINTS: Vec3[] = [
  [0.47, -2.85, 0.2],
  [0.47, -2.2, 0.0],
  [0.47, -1.5, -0.08],
  [0.46, -0.75, -0.14],
  [0.3, -0.05, -0.2],
];
const BASE_CURVE = new THREE.CatmullRomCurve3(HAM_LINE_POINTS.map((p) => new THREE.Vector3(...p)));
const FIBER_COUNT = 4;
const FIBER_SEGMENTS = 24;

function segmentCurve(range: [number, number]) {
  const steps = 16;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    pts.push(BASE_CURVE.getPoint(lerp(range[0], range[1], i / steps)));
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
function HamstringLine({ selectedPoint, tension }: { selectedPoint: DensityPointId; tension: number }) {
  return (
    <group>
      {DENSITY_POINTS.map((point) => {
        const curve = segmentCurve(point.range);
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

const HIP_Y = 0.05; // 股関節(骨盤の位置、BODY MAPと同じ)
const LUMBAR_TOP_Y = 1.1; // 腰椎の上端(胸郭の下、代償の回転軸)

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
  const maxHipDeg = lerp(80, 22, densification);
  const maxLumbarDeg = lerp(5, 38, densification);

  const hipAngle = (bendProgress * maxHipDeg * Math.PI) / 180;
  const lumbarAngle = (bendProgress * maxLumbarDeg * Math.PI) / 180;

  const tension = clamp(bendProgress * (0.3 + densification * 0.7), 0, 1);
  const lumbarStrain = clamp((lumbarAngle / ((38 * Math.PI) / 180)) * bendProgress, 0, 1);
  const hipLimitHit = clamp((bendProgress - 0.25) / 0.75, 0, 1) * densification;

  return (
    <group rotation={[0, 0.5, 0]} position={[0, 0.15, 0]}>
      <LowerBody />
      <JointLimitRing at={[0.45, -0.18, 0]} intensity={hipLimitHit} />
      <JointLimitRing at={[-0.45, -0.18, 0]} intensity={hipLimitHit} />

      {DENSITY_POINTS.map((point) => (
        <DensityHotspot key={point.id} point={point} active={selectedPoint === point.id} onSelect={onSelectPoint} />
      ))}

      <group position={[0, HIP_Y, 0]} rotation={[hipAngle, 0, 0]}>
        <group position={[0, -HIP_Y, 0]}>
          <LumbarSegment strain={lumbarStrain} />

          <group position={[0, LUMBAR_TOP_Y, 0]} rotation={[lumbarAngle, 0, 0]}>
            <group position={[0, -LUMBAR_TOP_Y, 0]}>
              <UpperBody />
            </group>
          </group>
        </group>
      </group>

      <HamstringLine selectedPoint={selectedPoint} tension={tension} />
    </group>
  );
}
