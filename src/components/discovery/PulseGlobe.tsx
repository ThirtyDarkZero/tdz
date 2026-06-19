import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PulseCity } from "@/hooks/useLivePulse";

function latLngToVec3(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function Globe({ cities, activeCity }: { cities: PulseCity[]; activeCity?: string }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.15;
  });

  return (
    <group ref={group}>
      {/* Base sphere */}
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#0a0a1a" transparent opacity={0.85} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.001, 48, 48]} />
        <meshBasicMaterial color="#00CFFF" wireframe transparent opacity={0.18} />
      </mesh>

      {cities.map((c) => {
        const pos = latLngToVec3(c.lat, c.lng, 1.05);
        const size = 0.025 + Math.min(0.06, c.count / 500);
        const isActive = activeCity === c.city;
        return (
          <group key={c.city} position={pos}>
            <mesh>
              <sphereGeometry args={[size, 12, 12]} />
              <meshBasicMaterial color={c.color} />
            </mesh>
            {isActive && (
              <mesh>
                <sphereGeometry args={[size * 2.2, 16, 16]} />
                <meshBasicMaterial color={c.color} transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function PulseGlobe({ cities, activeCity, size = 220 }: { cities: PulseCity[]; activeCity?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} aria-label="Live listening pulse globe">
      <Canvas camera={{ position: [0, 0, 2.6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <Globe cities={cities} activeCity={activeCity} />
      </Canvas>
    </div>
  );
}
