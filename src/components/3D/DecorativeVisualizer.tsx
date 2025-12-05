import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Simple decorative aurora that animates without audio input
export function DecorativeAurora() {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 10, 100, 50);
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#22c55e') }, // primary green
        uColor2: { value: new THREE.Color('#a855f7') }, // secondary purple
        uColor3: { value: new THREE.Color('#06b6d4') }, // accent cyan
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          float wave1 = sin(pos.x * 0.5 + uTime * 0.5) * 0.5;
          float wave2 = sin(pos.x * 0.3 - uTime * 0.3) * 0.3;
          float wave3 = cos(pos.y * 0.4 + uTime * 0.4) * 0.4;
          
          pos.z = wave1 + wave2 + wave3;
          vElevation = pos.z;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          float t = sin(uTime * 0.2 + vUv.x * 3.0) * 0.5 + 0.5;
          float t2 = cos(uTime * 0.3 + vUv.y * 2.0) * 0.5 + 0.5;
          
          vec3 color = mix(uColor1, uColor2, t);
          color = mix(color, uColor3, t2 * 0.5);
          
          float alpha = 0.3 + vElevation * 0.2;
          alpha *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    if (material.uniforms) {
      material.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={[0, 0, -5]} rotation={[-0.3, 0, 0]} />
  );
}

// Floating particles decoration
export function DecorativeParticles({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const colorPalette = [
      new THREE.Color('#22c55e'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#06b6d4'),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Combined decorative scene
export function DecorativeVisualizerScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <DecorativeAurora />
      <DecorativeParticles count={150} />
    </>
  );
}