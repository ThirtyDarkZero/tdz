import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

interface NoteProps {
  position: [number, number, number];
  color: string;
  delay: number;
}

function MusicNote({ position, color, delay }: NoteProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + delay;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + delay) * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

export function FloatingMusicNotes() {
  const notes = [
    { position: [-2, 1, 0] as [number, number, number], color: "#7FFF00", delay: 0 },
    { position: [2, 0.5, -1] as [number, number, number], color: "#FF00FF", delay: 1 },
    { position: [0, 2, 1] as [number, number, number], color: "#00FFFF", delay: 2 },
    { position: [-1.5, -0.5, 2] as [number, number, number], color: "#7FFF00", delay: 3 },
    { position: [1.5, 1.5, -2] as [number, number, number], color: "#FF00FF", delay: 4 },
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7FFF00" />
      
      {notes.map((note, i) => (
        <MusicNote key={i} {...note} />
      ))}
    </>
  );
}
