import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface YouTubeVisualizerPanelProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// Simulated audio-reactive aurora for YouTube (no actual audio data access)
function YouTubeAurora({ isPlaying, progress }: { isPlaying: boolean; progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(20, 10, 80, 40);
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uIntensity: { value: 0.5 },
        uColor1: { value: new THREE.Color('#ef4444') }, // YouTube red
        uColor2: { value: new THREE.Color('#f97316') }, // Orange
        uColor3: { value: new THREE.Color('#eab308') }, // Yellow
      },
      vertexShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          float wave1 = sin(pos.x * 0.5 + uTime * 0.8) * uIntensity;
          float wave2 = sin(pos.x * 0.3 - uTime * 0.5) * uIntensity * 0.7;
          float wave3 = cos(pos.y * 0.4 + uTime * 0.6) * uIntensity * 0.5;
          
          pos.z = wave1 + wave2 + wave3;
          vElevation = pos.z;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          float t = sin(uTime * 0.3 + vUv.x * 3.0) * 0.5 + 0.5;
          float t2 = cos(uTime * 0.4 + vUv.y * 2.0) * 0.5 + 0.5;
          
          vec3 color = mix(uColor1, uColor2, t);
          color = mix(color, uColor3, t2 * 0.5);
          
          // Progress-based gradient
          color = mix(color, uColor3, smoothstep(0.0, uProgress, vUv.x));
          
          float alpha = 0.4 + vElevation * 0.3;
          alpha *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (isPlaying) {
      timeRef.current = state.clock.elapsedTime;
      if (material.uniforms) {
        material.uniforms.uTime.value = timeRef.current;
        material.uniforms.uProgress.value = progress;
        material.uniforms.uIntensity.value = 0.5 + Math.sin(timeRef.current * 2) * 0.2;
      }
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={[0, 0, -5]} rotation={[-0.3, 0, 0]} />
  );
}

// Floating particles with YouTube color theme
function YouTubeParticles({ isPlaying, count = 60 }: { isPlaying: boolean; count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const colorPalette = [
      new THREE.Color('#ef4444'), // Red
      new THREE.Color('#f97316'), // Orange
      new THREE.Color('#fbbf24'), // Yellow
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
    if (meshRef.current && isPlaying) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
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
        size={0.1}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function YouTubeVisualizerScene({ isPlaying, progress }: { isPlaying: boolean; progress: number }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <YouTubeAurora isPlaying={isPlaying} progress={progress} />
      <YouTubeParticles isPlaying={isPlaying} count={60} />
    </>
  );
}

export function YouTubeVisualizerPanel({ isPlaying, currentTime, duration }: YouTubeVisualizerPanelProps) {
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="h-48 md:h-64 w-full bg-gradient-to-b from-red-950/30 to-background relative">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <YouTubeVisualizerScene isPlaying={isPlaying} progress={progress} />
        </Suspense>
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">YouTube Visualizer</span>
      </div>
    </div>
  );
}
