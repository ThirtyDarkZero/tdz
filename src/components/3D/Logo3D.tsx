import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

export function Logo3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font="/fonts/inter_bold.json"
          size={0.8}
          height={0.2}
          curveSegments={12}
        >
          TDZ
          <meshStandardMaterial
            color="#7FFF00"
            emissive="#7FFF00"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </Text3D>
      </Center>
      
      <pointLight position={[2, 2, 2]} intensity={1} color="#7FFF00" />
      <pointLight position={[-2, -2, 2]} intensity={0.5} color="#FF00FF" />
    </group>
  );
}
