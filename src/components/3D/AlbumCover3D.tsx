import { useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Float, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

interface AlbumCover3DProps {
  imageUrl: string;
  position?: [number, number, number];
  onClick?: () => void;
}

export function AlbumCover3D({ imageUrl, position = [0, 0, 0], onClick }: AlbumCover3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load texture
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = hovered 
        ? Math.sin(state.clock.elapsedTime * 2) * 0.3 
        : state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial
          map={texture}
          metalness={0.9}
          roughness={0.1}
          emissive="#7FFF00"
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* Reflection plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], -1, position[2]]}>
        <planeGeometry args={[10, 10]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#151515"
          metalness={0.5}
          mirror={0}
        />
      </mesh>
    </Float>
  );
}
