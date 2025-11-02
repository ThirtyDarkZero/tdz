import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ParticleField() {
  const points = useRef<THREE.Points>(null);
  
  const particlesCount = 2000;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particlesCount * 3);
    const color1 = new THREE.Color("#7FFF00");
    const color2 = new THREE.Color("#FF00FF");
    const color3 = new THREE.Color("#00FFFF");
    
    for (let i = 0; i < particlesCount; i++) {
      const mixRatio = Math.random();
      const color = mixRatio < 0.33 
        ? color1 
        : mixRatio < 0.66 
        ? color2 
        : color3;
      
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    
    return cols;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.05;
      points.current.rotation.x = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
