import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { REGIONS, type Region } from '../data/regions';

/** 全身骨格（BodyParts3D から作成。scripts/skeleton-model/build_skeleton.py） */
const MODEL_URL = '/models/skeleton.glb';

const ACCENT = '#5E8BA8';
/** 全身にかかわる系統(栄養など)のホットスポット色 */
const SYSTEM = '#C9982F';
const ACTIVE = '#C0562F';

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
  const haloRef = useRef<THREE.Mesh>(null);

  const isSystem = region.kind === 'system';
  const base = isSystem ? SYSTEM : ACCENT;
  const color = active ? ACTIVE : base;
  // 系統(栄養など)は「点」ではなく「領域」なので、ひと回り大きく柔らかい光にする
  const dotR = isSystem ? 0.19 : 0.13;
  const ringR = isSystem ? 0.24 : 0.16;

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime * (isSystem ? 1.5 : 2.2) + index * 0.7;
    const pulse = 1 + Math.sin(t) * 0.14;
    ref.current?.scale.setScalar(active ? 1.45 : pulse);
    if (ringRef.current) {
      ringRef.current.lookAt(camera.position);
      const rp = active ? 1.7 : 1.25 + Math.sin(t) * 0.18;
      ringRef.current.scale.setScalar(rp);
    }
    if (haloRef.current) {
      haloRef.current.lookAt(camera.position);
      haloRef.current.scale.setScalar(active ? 1.5 : 1.15 + Math.sin(t) * 0.12);
    }
  });

  return (
    <group position={region.position}>
      {/* 系統ホットスポットの柔らかい外周光 */}
      {isSystem && (
        <mesh ref={haloRef}>
          <circleGeometry args={[0.42, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={active ? 0.28 : 0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

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
        <sphereGeometry args={[dotR, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.6 : 0.9}
          roughness={0.3}
          transparent={isSystem}
          opacity={isSystem ? 0.9 : 1}
        />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[ringR, ringR + 0.025, 32]} />
        <meshBasicMaterial
          color={color}
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
  const { scene } = useGLTF(MODEL_URL);
  const skeleton = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      m.metalness = 0.05;
      // 光る点のクリックを骨がさえぎらないようにする
      mesh.raycast = () => {};
    });
    return root;
  }, [scene]);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <primitive object={skeleton} />

      {/* 部位ホットスポット */}
      {REGIONS.map((r, i) => (
        <Hotspot key={r.id} region={r} index={i} active={selected === r.id} onSelect={onSelect} />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
