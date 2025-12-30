import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Sparkles, Waves, Mountain, Circle, Zap, Maximize2, Minimize2 } from 'lucide-react';

interface YouTubeVisualizerPanelProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

type VisualizerMode = "aurora" | "waves" | "sphere" | "terrain" | "pulse";

// Simulated audio data generator for YouTube (no audio access)
function useSimulatedAudio(isPlaying: boolean, currentTime: number) {
  const getFrequencyData = useCallback(() => {
    if (!isPlaying) return new Uint8Array(256).fill(50);
    
    const data = new Uint8Array(256);
    const time = currentTime * 2;
    
    for (let i = 0; i < 256; i++) {
      // Create varied patterns based on frequency band
      const lowFreq = Math.sin(time * 0.5 + i * 0.02) * 0.5 + 0.5;
      const midFreq = Math.sin(time * 1.5 + i * 0.05) * 0.4 + 0.5;
      const highFreq = Math.sin(time * 3 + i * 0.1) * 0.3 + 0.5;
      
      // Mix based on position in spectrum
      let mix;
      if (i < 50) mix = lowFreq * 0.8 + midFreq * 0.2;
      else if (i < 150) mix = lowFreq * 0.3 + midFreq * 0.5 + highFreq * 0.2;
      else mix = midFreq * 0.3 + highFreq * 0.7;
      
      // Add some randomness for natural look
      const noise = (Math.random() - 0.5) * 0.2;
      data[i] = Math.floor((mix + noise) * 200 + 30);
    }
    return data;
  }, [isPlaying, currentTime]);

  const getAverageFrequency = useCallback(() => {
    if (!isPlaying) return 0.2;
    const base = (Math.sin(currentTime * 0.8) * 0.3 + 0.5);
    return base + (Math.random() - 0.5) * 0.1;
  }, [isPlaying, currentTime]);

  return { getFrequencyData, getAverageFrequency };
}

// Aurora Borealis Visualizer with YouTube red theme
function AuroraVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const meshRef = useRef<THREE.Points>(null);
  const particleCount = 2000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 10 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // YouTube themed colors - red, orange, yellow
      const t = Math.random();
      if (t < 0.4) {
        col[i * 3] = 0.9 + Math.random() * 0.1; // Red
        col[i * 3 + 1] = 0.2 + Math.random() * 0.1;
        col[i * 3 + 2] = 0.1;
      } else if (t < 0.7) {
        col[i * 3] = 0.9 + Math.random() * 0.1; // Orange
        col[i * 3 + 1] = 0.5 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.1;
      } else {
        col[i * 3] = 0.9; // Yellow
        col[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.2;
      }
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !isPlaying) return;
    
    const frequencyData = getFrequencyData();
    const avg = getAverageFrequency();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const freqIndex = Math.floor((i / particleCount) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 2 + i * 0.01) * 0.02 * (1 + freq);
      positions[i * 3] += Math.cos(state.clock.elapsedTime + i * 0.005) * 0.01;
      
      if (positions[i * 3 + 1] > 8) positions[i * 3 + 1] = -2;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Sound Wave Visualizer
function WaveVisualizer({ getFrequencyData, isPlaying }: any) {
  const meshRef = useRef<THREE.Line>(null);
  const numPoints = 256;

  const positions = useMemo(() => {
    const pos = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
      pos[i * 3] = (i / numPoints) * 16 - 8;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !isPlaying) return;
    
    const frequencyData = getFrequencyData();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < numPoints; i++) {
      const freq = frequencyData[i] / 255;
      positions[i * 3 + 1] = freq * 4 * Math.sin(state.clock.elapsedTime * 3 + i * 0.1);
      positions[i * 3 + 2] = Math.sin(state.clock.elapsedTime + i * 0.05) * freq * 2;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <line ref={meshRef as any}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={numPoints} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="#FF4444" linewidth={2} />
    </line>
  );
}

// Reactive Sphere Visualizer
function SphereVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (meshRef.current) {
      originalPositions.current = new Float32Array(
        (meshRef.current.geometry.attributes.position.array as Float32Array).length
      );
      originalPositions.current.set(meshRef.current.geometry.attributes.position.array as Float32Array);
    }
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !isPlaying || !originalPositions.current) return;
    
    const frequencyData = getFrequencyData();
    const avg = getAverageFrequency();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const original = originalPositions.current;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const freqIndex = Math.floor((i / (positions.length / 3)) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      
      const ox = original[i * 3];
      const oy = original[i * 3 + 1];
      const oz = original[i * 3 + 2];
      
      const scale = 1 + freq * 0.5 + Math.sin(state.clock.elapsedTime * 4 + i * 0.1) * 0.1 * avg;
      
      positions[i * 3] = ox * scale;
      positions[i * 3 + 1] = oy * scale;
      positions[i * 3 + 2] = oz * scale;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 5]} />
      <meshStandardMaterial 
        color="#FF4444" 
        wireframe 
        emissive="#FF4444"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// Terrain Visualizer
function TerrainVisualizer({ getFrequencyData, isPlaying }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !isPlaying) return;
    
    const frequencyData = getFrequencyData();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const segments = 64;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const ix = i % (segments + 1);
      const iy = Math.floor(i / (segments + 1));
      const freqIndex = Math.floor((ix / segments) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      
      positions[i * 3 + 2] = freq * 3 + 
        Math.sin(state.clock.elapsedTime * 2 + ix * 0.3) * 0.5 +
        Math.cos(state.clock.elapsedTime * 1.5 + iy * 0.3) * 0.3;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[16, 10, 64, 64]} />
      <meshStandardMaterial 
        color="#FF6B35" 
        wireframe 
        emissive="#FF6B35"
        emissiveIntensity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Pulse Rings Visualizer
function PulseVisualizer({ getFrequencyData, isPlaying }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsCount = 8;

  useFrame((state) => {
    if (!groupRef.current || !isPlaying) return;
    
    const frequencyData = getFrequencyData();
    
    groupRef.current.children.forEach((ring, i) => {
      const freqIndex = Math.floor((i / ringsCount) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      
      const scale = 1 + freq * 2 + i * 0.5;
      ring.scale.setScalar(scale);
      ring.rotation.z = state.clock.elapsedTime * (0.5 - i * 0.1) + i * 0.5;
      ring.rotation.x = Math.sin(state.clock.elapsedTime + i) * 0.3;
      
      ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.3 + freq * 0.7;
    });
    
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: ringsCount }).map((_, i) => (
        <mesh key={i}>
          <torusGeometry args={[1 + i * 0.3, 0.02, 16, 100]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? "#FF4444" : "#FF8800"} 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main scene component
function VisualizerScene({ mode, isPlaying, currentTime }: { mode: VisualizerMode; isPlaying: boolean; currentTime: number }) {
  const { getFrequencyData, getAverageFrequency } = useSimulatedAudio(isPlaying, currentTime);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FF4444" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF8800" />
      
      {mode === "aurora" && (
        <AuroraVisualizer 
          getFrequencyData={getFrequencyData} 
          getAverageFrequency={getAverageFrequency}
          isPlaying={isPlaying} 
        />
      )}
      {mode === "waves" && (
        <WaveVisualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} />
      )}
      {mode === "sphere" && (
        <SphereVisualizer 
          getFrequencyData={getFrequencyData} 
          getAverageFrequency={getAverageFrequency}
          isPlaying={isPlaying} 
        />
      )}
      {mode === "terrain" && (
        <TerrainVisualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} />
      )}
      {mode === "pulse" && (
        <PulseVisualizer 
          getFrequencyData={getFrequencyData} 
          isPlaying={isPlaying} 
        />
      )}
    </>
  );
}

export function YouTubeVisualizerPanel({ isPlaying, currentTime, duration }: YouTubeVisualizerPanelProps) {
  const [mode, setMode] = useState<VisualizerMode>("aurora");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const modes: { id: VisualizerMode; label: string; icon: any }[] = [
    { id: "aurora", label: "Aurora", icon: Sparkles },
    { id: "waves", label: "Waves", icon: Waves },
    { id: "sphere", label: "Sphere", icon: Circle },
    { id: "terrain", label: "Terrain", icon: Mountain },
    { id: "pulse", label: "Pulse", icon: Zap },
  ];

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black/90 overflow-hidden transition-all duration-300 ${
        isFullscreen ? "w-screen h-screen" : "w-full h-48 md:h-64"
      }`}
    >
      {/* Mode selector */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 bg-black/60 backdrop-blur-sm rounded-full border border-red-500/20">
        {modes.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={mode === id ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode(id)}
            className={`h-7 px-2.5 rounded-full transition-all text-xs ${
              mode === id 
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline font-medium">{label}</span>
          </Button>
        ))}
      </div>

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 h-7 w-7 bg-black/60 backdrop-blur-sm border border-red-500/20 rounded-full hover:bg-red-500/20"
      >
        {isFullscreen ? (
          <Minimize2 className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Maximize2 className="h-3.5 w-3.5 text-foreground" />
        )}
      </Button>

      {/* 3D Canvas */}
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <Canvas
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          gl={{ 
            antialias: false,
            powerPreference: "high-performance",
            alpha: false 
          }}
        >
          <color attach="background" args={['#0a0a0a']} />
          <fog attach="fog" args={['#0a0a0a', 5, 20]} />
          <VisualizerScene mode={mode} isPlaying={isPlaying} currentTime={currentTime} />
        </Canvas>
      </Suspense>

      {/* Glow overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-red-500/5 via-transparent to-orange-500/5" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-orange-500/20 to-transparent pointer-events-none" />
      
      {/* Status indicator */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-red-500/50'}`} />
        <span className="text-[10px] text-muted-foreground">YouTube Visualizer</span>
      </div>
    </div>
  );
}
