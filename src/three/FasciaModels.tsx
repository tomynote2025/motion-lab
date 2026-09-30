import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * FASCIA LAB の3D断面モデル。
 * Stecco らの筋膜解剖(浅筋膜=皮膚支帯で層を貫く／深筋膜=繊維方向の異なる
 * コラーゲン層がヒアルロン酸で滑走)を、積層した立体として表現する。
 * ドラッグ操作自体はDOM側(HTMLオーバーレイ)で受け取り、ここでは
 * 受け取った値を元に見た目だけを描画する。
 */

/** 皮膚らしい質感(血色のムラ・毛穴)をプロシージャルに生成する */
function useSkinTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;

    // ベースの肌色グラデーション(むらのある肌色)
    const base = ctx.createLinearGradient(0, 0, 0, canvas.height);
    base.addColorStop(0, '#e3b592');
    base.addColorStop(0.45, '#d8a67d');
    base.addColorStop(1, '#c99164');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 血色のムラ(赤み)
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 18 + Math.random() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(196, 92, 78, 0.16)');
      g.addColorStop(1, 'rgba(196, 92, 78, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 明るいハイライト(不均一な照り)
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 20 + Math.random() * 45;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255, 238, 214, 0.12)');
      g.addColorStop(1, 'rgba(255, 238, 214, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 毛穴・微細なノイズ
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const dark = Math.random() > 0.4;
      ctx.fillStyle = dark ? 'rgba(70, 42, 26, 0.10)' : 'rgba(255, 235, 210, 0.10)';
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + Math.random() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }, []);
}

/** from→to をつなぐ円柱(支帯・繊維など、傾いた棒状のもの共通で使う) */
function Strut({
  from,
  to,
  r,
  color,
  emissive,
  opacity = 1,
}: {
  from: [number, number, number];
  to: [number, number, number];
  r: number;
  color: string;
  emissive?: string;
  opacity?: number;
}) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length(), 0.02);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: a.clone().lerp(b, 0.5), quat, len };
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.35 : 0} roughness={0.6} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

/* =============== 浅筋膜:立体断面 =============== */

const SF_WIDTH = 6.4;
const SF_DEPTH = 1.9;
const SF_ANCHORS_X = [-2.4, -1.2, 0, 1.2, 2.4];

export function SuperficialFasciaModel3D({
  skinShift,
  sfShift,
  laxity,
}: {
  /** 皮膚のX方向オフセット */
  skinShift: number;
  /** 浅筋膜のX方向オフセット(皮膚に一部追従) */
  sfShift: number;
  /** 0=健康(張りがある)、1=緩んで波打つ */
  laxity: number;
}) {
  const membraneSegs = useMemo(() => {
    const amp = 0.05 + laxity * 0.22;
    const pts: [number, number][] = [];
    for (let x = -SF_WIDTH / 2 + 0.2; x <= SF_WIDTH / 2 - 0.2; x += 0.5) {
      const idx = Math.round((x + SF_WIDTH / 2) / 0.5);
      pts.push([x, idx % 2 === 0 ? -amp : amp]);
    }
    return pts;
  }, [laxity]);

  const skinTexture = useSkinTexture();

  return (
    <group>
      {/* 深筋膜(土台・固定) */}
      <mesh position={[0, -1.95, 0]}>
        <boxGeometry args={[SF_WIDTH + 0.1, 0.36, SF_DEPTH]} />
        <meshStandardMaterial color="#22402F" roughness={0.6} />
      </mesh>

      {/* 深脂肪層(DAT) */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[SF_WIDTH, 1.0, SF_DEPTH]} />
        <meshStandardMaterial color="#2a2118" roughness={0.85} transparent opacity={0.7} />
      </mesh>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => (
        <mesh key={`dat${i}`} position={[x, -1.15, 0.25]}>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshStandardMaterial color="#3a2c1e" roughness={0.9} />
        </mesh>
      ))}

      {/* 皮膚支帯(深層〜浅筋膜) */}
      {SF_ANCHORS_X.map((x, i) => (
        <Strut key={`p${i}`} from={[x, -1.72, 0]} to={[x + sfShift, -0.62, 0]} r={0.028} color="#6f5a3f" />
      ))}

      {/* 浅筋膜(膜様層)— 波打つジグザグの帯 */}
      <group position={[sfShift, -0.5, 0]}>
        {membraneSegs.slice(0, -1).map(([x, y], i) => {
          const [nx, ny] = membraneSegs[i + 1];
          const mx = (x + nx) / 2;
          const my = (y + ny) / 2;
          const dx = nx - x;
          const dy = ny - y;
          const len = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          return (
            <mesh key={i} position={[mx, my, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[len + 0.06, 0.09, SF_DEPTH * 0.86]} />
              <meshStandardMaterial color="#86B98C" roughness={0.4} emissive="#3f5e42" emissiveIntensity={0.2} />
            </mesh>
          );
        })}
      </group>

      {/* 浅脂肪層(SAT) */}
      <mesh position={[sfShift * 0.4, 0.28, 0]}>
        <boxGeometry args={[SF_WIDTH, 1.15, SF_DEPTH]} />
        <meshStandardMaterial color="#3a2c1e" roughness={0.85} transparent opacity={0.6} />
      </mesh>
      {[-2.1, -0.6, 0.7, 2.0].map((x, i) => (
        <mesh key={`sat${i}`} position={[x + skinShift * 0.55, 0.3, 0.25]}>
          <sphereGeometry args={[0.3, 14, 14]} />
          <meshStandardMaterial color="#4a3722" roughness={0.9} />
        </mesh>
      ))}

      {/* 皮膚支帯(浅筋膜〜皮膚) */}
      {SF_ANCHORS_X.map((x, i) => (
        <Strut key={`s${i}`} from={[x + sfShift, -0.4, 0]} to={[x + skinShift, 0.85, 0]} r={0.028} color="#8a6f4d" />
      ))}

      {/* 皮膚(ドラッグ対象)— 血色のムラ・毛穴のあるプロシージャル質感 */}
      <group position={[skinShift, 1.15, 0]}>
        <mesh>
          <boxGeometry args={[SF_WIDTH + 0.2, 0.5, SF_DEPTH + 0.1]} />
          <meshStandardMaterial map={skinTexture} color="#ffffff" roughness={0.62} />
        </mesh>
        {/* 上面のてかり(角質層のハイライト) */}
        <mesh position={[0, 0.251, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SF_WIDTH + 0.2, SF_DEPTH + 0.1]} />
          <meshStandardMaterial map={skinTexture} color="#ffe9d4" roughness={0.3} transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/* =============== 深筋膜:立体断面 =============== */

const DF_WIDTH = 6.4;
const DF_DEPTH = 1.9;

function FiberLayer({ y, angle, shiftX }: { y: number; angle: number; shiftX: number }) {
  const rad = (angle * Math.PI) / 180;
  const count = 8;
  const fiberLen = 1.05;
  return (
    <group position={[shiftX, y, 0]}>
      {/* 層の境界を分かりやすくする板(枠つき) */}
      <mesh>
        <boxGeometry args={[DF_WIDTH, 0.3, DF_DEPTH]} />
        <meshStandardMaterial color="#e8e2d2" transparent opacity={0.16} roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[DF_WIDTH + 0.02, 0.02, DF_DEPTH + 0.02]} />
        <meshStandardMaterial color="#ddd6c4" transparent opacity={0.35} roughness={0.5} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[-DF_WIDTH / 2 + 0.4 + i * ((DF_WIDTH - 0.8) / (count - 1)), 0, 0]} rotation={[0, 0, rad]}>
          <cylinderGeometry args={[0.032, 0.032, fiberLen, 6]} />
          <meshStandardMaterial color="#ddd6c4" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function DeepFasciaModel3D({
  l1Shift,
  l2Shift,
  haColor,
  haThickness,
}: {
  /** コラーゲン層I(表層・ドラッグ対象)のXオフセット */
  l1Shift: number;
  /** コラーゲン層II(中間)のXオフセット */
  l2Shift: number;
  /** ヒアルロン酸層の色(粘度で変化) */
  haColor: string;
  /** ヒアルロン酸層の厚み(粘度で変化) */
  haThickness: number;
}) {
  return (
    <group>
      {/* 疎性結合組織(上) */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[DF_WIDTH + 0.1, 0.32, DF_DEPTH]} />
        <meshStandardMaterial color="#14281D" roughness={0.7} />
      </mesh>

      {/* コラーゲン層 I(表層・ドラッグ対象) */}
      <FiberLayer y={1.02} angle={20} shiftX={l1Shift} />

      {/* ヒアルロン酸層1 */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[DF_WIDTH, haThickness, DF_DEPTH]} />
        <meshStandardMaterial color={haColor} transparent opacity={0.82} roughness={0.15} />
      </mesh>

      {/* コラーゲン層 II(中間) */}
      <FiberLayer y={0.22} angle={-38} shiftX={l2Shift} />

      {/* ヒアルロン酸層2 */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[DF_WIDTH, haThickness, DF_DEPTH]} />
        <meshStandardMaterial color={haColor} transparent opacity={0.82} roughness={0.15} />
      </mesh>

      {/* コラーゲン層 III(深層・固定) */}
      <FiberLayer y={-0.58} angle={20} shiftX={0} />

      {/* 筋(筋外膜) */}
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[DF_WIDTH + 0.1, 0.14, DF_DEPTH]} />
        <meshStandardMaterial color="#5a2f2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.75, 0]}>
        <boxGeometry args={[DF_WIDTH + 0.1, 0.8, DF_DEPTH]} />
        <meshStandardMaterial color="#3a1f1c" roughness={0.85} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-DF_WIDTH / 2 + 0.35 + i * ((DF_WIDTH - 0.7) / 11), -1.75, DF_DEPTH / 2 - 0.1]}>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#5a2f2a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
