import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';

/**
 * IAP ANATOMY — 実際の解剖データ(BodyParts3D)から作った胴体で、腹腔内圧を見せるモデル。
 *
 * モデル: public/models/iap-torso.glb（Blender で部位を抜き出して軽量化したもの）
 *   ribs / cartilage / sternum / thoracic / L1〜L5 / discs / pelvis / diaphragm / pelvic_floor / oblique
 * 座標: 前 = +Z、背骨は Z≒0.1〜0.45、腹壁の前面は Z≒0.88、骨盤底は Y≒-0.7〜-0.95。
 *
 * 出典: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
 */

const MODEL_URL = '/models/iap-torso.glb';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const BONE_COLOR = '#ddd6c4';
const ACTIVE = '#C0562F';
const DIA_COLOR = '#5E8BA8';
const WALL_COLOR = '#86B98C';
const FLOOR_COLOR = '#C9982F';

type Vec3 = [number, number, number];

function Arrow({ from, dir, length, color, radius = 0.03 }: { from: Vec3; dir: Vec3; length: number; color: string; radius?: number }) {
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()),
    [dir[0], dir[1], dir[2]],
  );
  if (length < 0.04) return null;
  const head = Math.min(0.14, length * 0.45);
  const shaft = length - head;
  return (
    <group position={from} quaternion={quat}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, shaft, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]}>
        <coneGeometry args={[radius * 2.6, head, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Label({ at, color, children }: { at: Vec3; color: string; children: string }) {
  return (
    <Html position={at} center style={{ pointerEvents: 'none' }}>
      <span className="iap3d-label" style={{ color, borderColor: color }}>
        {children}
      </span>
    </Html>
  );
}

/** glb の中から名前で形状を取り出す（Canvas ごとに同じ形状を共有し、材質は各自で持つ） */
function useParts() {
  const { scene } = useGLTF(MODEL_URL);
  return useMemo(() => {
    const map: Record<string, THREE.BufferGeometry> = {};
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) map[o.name] = (o as THREE.Mesh).geometry;
    });
    return map;
  }, [scene]);
}

export function IapAnatomy3D({
  dia,
  tva,
  pf,
  load,
  pressLoad = 0,
  breath = 0.5,
  showLabels = true,
}: {
  dia: number;
  tva: number;
  pf: number;
  /** 背骨にかかる負荷 0〜1(体重分を含む) */
  load: number;
  /** 長押しで加えた負荷 0〜1(上からの矢印の表示用) */
  pressLoad?: number;
  /** 呼吸 0=呼気, 1=吸気。吸気で横隔膜と骨盤底が下がり、腹壁が広がる */
  breath?: number;
  showLabels?: boolean;
}) {
  const g = useParts();

  const coordination = clamp(1 - (Math.abs(dia - tva) + Math.abs(dia - pf) + Math.abs(tva - pf)) / 2.1, 0, 1);
  const quality = (dia + tva + pf) / 3;
  const support = clamp(coordination * quality * 1.15, 0, 1);
  const pressure = clamp(0.25 + support * 0.85, 0, 1);
  const stress = clamp(load * (1 - support), 0, 1);

  const diaLeak = load * clamp(1 - dia * 1.4, 0, 1);
  const wallLeak = load * clamp(1 - tva * 1.4, 0, 1);
  const floorLeak = load * clamp(1 - pf * 1.4, 0, 1);

  // 呼吸の動き(負荷中は小さくなる)
  const breathAmp = breath * (1 - load * 0.5);
  const diaDrop = breathAmp * 0.08 * (0.3 + 0.7 * dia);
  const floorDrop = breathAmp * 0.045 * (0.3 + 0.7 * pf);
  const wallBreath = breathAmp * 0.07 * (0.3 + 0.7 * tva);

  const wallBulge = 1 + wallLeak * 0.22 + wallBreath; // 背骨側を支点に前へふくらむ
  const floorSag = floorLeak * 0.12;
  const diaRise = diaLeak * 0.1;

  const bone = useMemo(() => new THREE.MeshStandardMaterial({ color: BONE_COLOR, roughness: 0.55, metalness: 0.05 }), []);
  const lumbarMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, emissive: new THREE.Color(ACTIVE) });
    return m;
  }, []);
  lumbarMat.color = new THREE.Color(BONE_COLOR).lerp(new THREE.Color(ACTIVE), clamp(stress * 1.4, 0, 1));
  lumbarMat.emissiveIntensity = stress * 0.8;

  // 腹腔(圧の風船)の大きさ: 横隔膜の下〜骨盤底の上、腰椎の前〜腹壁の内側
  const CAV: Vec3 = [0, -0.08, 0.6];

  // 腹圧で支えきれないと、腰椎が1節ずつ曲がり、その上の胸郭ごと崩れる。
  // 崩れる方向は「どこが働いていないか」で変える(教育用の単純化):
  //   横隔膜・骨盤底が働かない → 圧が上下へ逃げ、体幹が丸まる(屈曲)
  //   腹壁が働かない           → 圧が前へ逃げ、前側で支えられず腰が反る(伸展)
  const flexWeak = clamp(1 - (dia + pf) / 2, 0, 1);
  const extWeak = clamp(1 - tva, 0, 1);
  const bias = Math.tanh(6 * (flexWeak - extWeak)); // +1=屈曲, -1=伸展
  // 小さな負荷でも崩れ始めが見えるよう、stress を少し持ち上げてから角度にする
  const flex = Math.pow(stress, 0.7) * bias * (bias > 0 ? 0.13 : 0.12); // 1節あたり(rad)。屈曲は最大約37°、伸展は最大約34°
  const collapseLabel = bias >= 0 ? '支えきれず背骨が丸まって崩れる' : '支えきれず腰が反って崩れる';
  const LUMBAR_CHAIN: { name: string; pivot: Vec3 }[] = [
    { name: 'L5', pivot: [0, -0.36, 0.36] },
    { name: 'L4', pivot: [0, -0.23, 0.36] },
    { name: 'L3', pivot: [0, -0.11, 0.36] },
    { name: 'L2', pivot: [0, -0.01, 0.36] },
    { name: 'L1', pivot: [0, 0.09, 0.36] },
  ];

  /** 腰椎より上(胸郭・横隔膜・負荷の矢印)。背骨と一緒に動く */
  const upper = (
    <>
      {['ribs', 'cartilage', 'sternum', 'thoracic'].map((n) => g[n] && <mesh key={n} geometry={g[n]} material={bone} />)}

      {/* 天井: 横隔膜 */}
      {g.diaphragm && (
        <mesh geometry={g.diaphragm} position={[0, diaRise - diaDrop, 0]} renderOrder={2}>
          <meshStandardMaterial
            color={DIA_COLOR}
            transparent
            opacity={0.3 + dia * 0.6}
            wireframe={dia < 0.45}
            side={THREE.DoubleSide}
            roughness={0.5}
            depthWrite={dia >= 0.45}
          />
        </mesh>
      )}
      <Arrow from={[0, 0.72 + diaRise, 0.6]} dir={[0, 1, 0.25]} length={diaLeak * 0.6} color={ACTIVE} radius={0.045} />

      {/* 負荷: 上からの押しつぶす力 */}
      {pressLoad > 0.05 && (
        <>
          <Arrow from={[0, 1.98, 0.25]} dir={[0, -1, 0]} length={0.2 + pressLoad * 0.22} color="#efeadc" radius={0.03} />
          {showLabels && <Label at={[0.36, 1.86, 0.25]} color="#efeadc">負荷</Label>}
        </>
      )}
      {showLabels && <Label at={[-0.72, 0.62 + diaRise, 0.4]} color={DIA_COLOR}>天井｜横隔膜</Label>}
    </>
  );

  const renderLumbar = (i: number): ReactNode => {
    const seg = LUMBAR_CHAIN[i];
    const back: Vec3 = [-seg.pivot[0], -seg.pivot[1], -seg.pivot[2]];
    return (
      <group position={seg.pivot} rotation={[flex, 0, 0]}>
        <group position={back}>
          {g[seg.name] && <mesh geometry={g[seg.name]} material={lumbarMat} />}
          {i < LUMBAR_CHAIN.length - 1 ? renderLumbar(i + 1) : upper}
        </group>
      </group>
    );
  };

  return (
    <group position={[0, -0.25, -0.45]}>
      {/* 骨盤(固定) */}
      {g.pelvis && <mesh geometry={g.pelvis} material={bone} />}

      {/* 腰椎〜胸郭(腹圧が足りないと前へ崩れる) */}
      {renderLumbar(0)}

      {/* 圧の風船 */}
      <mesh
        position={[CAV[0], CAV[1] - (floorSag + floorDrop) * 0.4 + (diaRise - diaDrop) * 0.4, CAV[2] + (wallBulge - 1) * 0.12]}
        scale={[0.4 * (1 + wallBreath * 0.5), 0.62 + (floorSag + diaRise) * 0.45 + (floorDrop - diaDrop) * 0.4, 0.27 * wallBulge]}
        renderOrder={1}
      >
        <sphereGeometry args={[1, 40, 28]} />
        <meshStandardMaterial
          color={ACTIVE}
          emissive={ACTIVE}
          emissiveIntensity={0.5 + pressure * 0.7}
          transparent
          opacity={0.3 + pressure * 0.45}
          roughness={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* 床: 骨盤底 */}
      {g.pelvic_floor && (
        <mesh geometry={g.pelvic_floor} position={[0, -floorSag - floorDrop, 0]} renderOrder={2}>
          <meshStandardMaterial
            color={FLOOR_COLOR}
            transparent
            opacity={0.35 + pf * 0.6}
            wireframe={pf < 0.45}
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>
      )}

      {/* 壁: 腹壁(背骨側を支点に前へふくらませる) */}
      {g.oblique && (
        <group position={[0, 0, 0.45]} scale={[1 + (wallBulge - 1) * 0.3, 1, wallBulge]}>
          <mesh geometry={g.oblique} position={[0, 0, -0.45]} renderOrder={3}>
            <meshStandardMaterial
              color={WALL_COLOR}
              transparent
              opacity={0.08 + tva * 0.2}
              wireframe={tva < 0.45}
              side={THREE.DoubleSide}
              roughness={0.5}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* まとまった圧が内側から押す矢印 */}
      {support > 0.5 &&
        ([
          [0, 0, 1],
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
        ] as Vec3[]).map((d, i) => (
          <Arrow key={i} from={CAV} dir={d} length={d[1] !== 0 ? 0.42 : d[2] !== 0 ? 0.2 : 0.3} color="#ffd8d3" radius={0.02} />
        ))}

      {/* 圧が逃げる矢印(壁・床) */}
      <Arrow from={[0, -0.1, 0.86 * wallBulge]} dir={[0, 0, 1]} length={wallLeak * 0.55} color={ACTIVE} radius={0.045} />
      <Arrow from={[0.3, -0.25, 0.78 * wallBulge]} dir={[0.5, 0, 1]} length={wallLeak * 0.4} color={ACTIVE} radius={0.045} />
      <Arrow from={[0, -0.95 - floorSag, 0.25]} dir={[0, -1, 0]} length={floorLeak * 0.6} color={ACTIVE} radius={0.045} />

      {showLabels && (
        <>
          <Label at={[0, -0.32, 1.12]} color={WALL_COLOR}>壁｜腹壁</Label>
          <Label at={[-0.62, -0.86 - floorSag, 0.3]} color={FLOOR_COLOR}>床｜骨盤底</Label>
          <Label at={[0.42, -0.05, 0.05]} color={stress > 0.2 ? ACTIVE : BONE_COLOR}>
            {stress > 0.2 ? collapseLabel : '背骨がまっすぐ保たれる'}
          </Label>
        </>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
