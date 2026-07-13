import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { REGIONS, type Region } from '../data/regions';

const BONE_COLOR = '#ddd6c4';
const ACCENT = '#5E8BA8';
const ACTIVE = '#C0562F';

type Vec3 = [number, number, number];

const boneMaterial = new THREE.MeshStandardMaterial({
  color: BONE_COLOR,
  roughness: 0.55,
  metalness: 0.05,
});

function Bone({ from, to, r }: { from: Vec3; to: Vec3; r: number }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length() - r * 1.2, 0.05);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { pos: a.clone().lerp(b, 0.5), quat, len };
  }, [from, to, r]);
  return (
    <mesh position={pos} quaternion={quat} material={boneMaterial}>
      <capsuleGeometry args={[r, len, 6, 14]} />
    </mesh>
  );
}

function Joint({ at, r }: { at: Vec3; r: number }) {
  return (
    <mesh position={at} material={boneMaterial}>
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

function Hotspot({
  region,
  index,
  active,
  onSelect,
}: {
  region: Region;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime * 2.2 + index * 0.7;
    const pulse = 1 + Math.sin(t) * 0.14;
    ref.current?.scale.setScalar(active ? 1.55 : pulse);
    if (ringRef.current) {
      ringRef.current.lookAt(camera.position);
      const rp = active ? 1.7 : 1.25 + Math.sin(t) * 0.18;
      ringRef.current.scale.setScalar(rp);
    }
  });
  return (
    <group position={region.position}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(region.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color={active ? ACTIVE : ACCENT}
          emissive={active ? ACTIVE : ACCENT}
          emissiveIntensity={active ? 1.6 : 0.9}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.16, 0.185, 32]} />
        <meshBasicMaterial
          color={active ? ACTIVE : ACCENT}
          transparent
          opacity={active ? 0.9 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function SkeletonModel({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group}>
      {/* 頭蓋骨 */}
      <mesh position={[0, 2.95, 0]} scale={[0.86, 1, 0.92]} material={boneMaterial}>
        <sphereGeometry args={[0.46, 24, 24]} />
      </mesh>
      <mesh position={[0, 2.6, 0.1]} material={boneMaterial}>
        <boxGeometry args={[0.34, 0.26, 0.32]} />
      </mesh>

      {/* 頸椎〜脊柱 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, 0.35 + i * 0.245, i < 6 ? -0.06 : 0]} material={boneMaterial}>
          <cylinderGeometry args={[0.11, 0.11, 0.15, 12]} />
        </mesh>
      ))}

      {/* 胸郭 */}
      <Rib y={2.1} rx={0.5} />
      <Rib y={1.92} rx={0.6} />
      <Rib y={1.72} rx={0.66} />
      <Rib y={1.52} rx={0.64} />
      <Rib y={1.32} rx={0.56} />
      {/* 胸骨 */}
      <mesh position={[0, 1.75, 0.44]} material={boneMaterial}>
        <boxGeometry args={[0.14, 0.72, 0.06]} />
      </mesh>

      {/* 鎖骨・肩 */}
      <Bone from={[0.1, 2.12, 0.3]} to={[0.78, 2.05, 0]} r={0.05} />
      <Bone from={[-0.1, 2.12, 0.3]} to={[-0.78, 2.05, 0]} r={0.05} />
      <Joint at={[0.78, 2.05, 0]} r={0.15} />
      <Joint at={[-0.78, 2.05, 0]} r={0.15} />

      {/* 腕 */}
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

      {/* 骨盤 */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2.4, 0, 0]} scale={[1, 0.8, 1]} material={boneMaterial}>
        <torusGeometry args={[0.42, 0.11, 12, 30]} />
      </mesh>
      <mesh position={[0, -0.02, -0.12]} rotation={[0.5, 0, 0]} material={boneMaterial}>
        <boxGeometry args={[0.26, 0.34, 0.14]} />
      </mesh>

      {/* 脚 */}
      <Joint at={[0.45, -0.18, 0]} r={0.14} />
      <Joint at={[-0.45, -0.18, 0]} r={0.14} />
      <Bone from={[0.45, -0.18, 0]} to={[0.47, -1.55, 0]} r={0.09} />
      <Bone from={[-0.45, -0.18, 0]} to={[-0.47, -1.55, 0]} r={0.09} />
      <Joint at={[0.47, -1.55, 0]} r={0.13} />
      <Joint at={[-0.47, -1.55, 0]} r={0.13} />
      <Bone from={[0.47, -1.55, 0]} to={[-0.47 + 0.94, -2.85, 0]} r={0.07} />
      <Bone from={[-0.47, -1.55, 0]} to={[-0.47, -2.85, 0]} r={0.07} />
      {/* 足 */}
      <mesh position={[0.47, -2.98, 0.18]} material={boneMaterial}>
        <boxGeometry args={[0.22, 0.12, 0.52]} />
      </mesh>
      <mesh position={[-0.47, -2.98, 0.18]} material={boneMaterial}>
        <boxGeometry args={[0.22, 0.12, 0.52]} />
      </mesh>

      {/* 部位ホットスポット */}
      {REGIONS.map((r, i) => (
        <Hotspot key={r.id} region={r} index={i} active={selected === r.id} onSelect={onSelect} />
      ))}
    </group>
  );
}
