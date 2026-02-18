import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Sparkles, Waves, Mountain, Circle, Zap, Maximize2, Minimize2, Palette, Building2, Disc3, Orbit } from "lucide-react";

interface AudioVisualizer3DProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  genre?: string;
  mood?: string;
}

type VisualizerMode = "aurora" | "waves" | "sphere" | "terrain" | "pulse" | "neon" | "vinyl" | "space";

// Auto-theme mapping
function getAutoTheme(genre?: string, mood?: string): VisualizerMode | null {
  const g = (genre || "").toLowerCase();
  const m = (mood || "").toLowerCase();
  if (/electronic|edm|pop|dance|synth|house|techno/.test(g) || /energetic|party/.test(m)) return "neon";
  if (/hip-hop|rap|lofi|lo-fi|r&b|soul|funk/.test(g) || /chill|mellow/.test(m)) return "vinyl";
  if (/ambient|classical|chill|atmospheric|new age|meditation/.test(g) || /calm|peaceful|dreamy/.test(m)) return "space";
  return null;
}

// Audio analyzer hook
function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!audioElement) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!connectedRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        const analyser = audioContextRef.current.createAnalyser();
        sourceRef.current.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        analyserRef.current = analyser;
        connectedRef.current = true;
      } catch (error) {
        console.warn("Audio element already connected to AudioContext");
      }
    }
  }, [audioElement]);

  const getFrequencyData = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return new Uint8Array(256).fill(128);
  };

  const getAverageFrequency = () => {
    const data = getFrequencyData();
    return data.reduce((a, b) => a + b, 0) / data.length / 255;
  };

  return { getFrequencyData, getAverageFrequency };
}

// ============ ORIGINAL VISUALIZERS ============

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
      const t = Math.random();
      col[i * 3] = t < 0.5 ? 0.2 : 0.1;
      col[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      col[i * 3 + 2] = t < 0.5 ? 0.5 : 1.0;
    }
    return [pos, col];
  }, []);
  useFrame((state) => {
    if (!meshRef.current || !isPlaying) return;
    const frequencyData = getFrequencyData();
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
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < numPoints; i++) {
      const freq = frequencyData[i] / 255;
      pos[i * 3 + 1] = freq * 4 * Math.sin(state.clock.elapsedTime * 3 + i * 0.1);
      pos[i * 3 + 2] = Math.sin(state.clock.elapsedTime + i * 0.05) * freq * 2;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <line ref={meshRef as any}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={numPoints} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="#7FFF00" linewidth={2} />
    </line>
  );
}

function SphereVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  useEffect(() => {
    if (meshRef.current) {
      originalPositions.current = new Float32Array(meshRef.current.geometry.attributes.position.array as Float32Array);
    }
  }, []);
  useFrame((state) => {
    if (!meshRef.current || !isPlaying || !originalPositions.current) return;
    const frequencyData = getFrequencyData();
    const avg = getAverageFrequency();
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const orig = originalPositions.current;
    for (let i = 0; i < pos.length / 3; i++) {
      const freqIndex = Math.floor((i / (pos.length / 3)) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      const scale = 1 + freq * 0.5 + Math.sin(state.clock.elapsedTime * 4 + i * 0.1) * 0.1 * avg;
      pos[i * 3] = orig[i * 3] * scale;
      pos[i * 3 + 1] = orig[i * 3 + 1] * scale;
      pos[i * 3 + 2] = orig[i * 3 + 2] * scale;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 5]} />
      <meshStandardMaterial color="#7FFF00" wireframe emissive="#7FFF00" emissiveIntensity={0.5} />
    </mesh>
  );
}

function TerrainVisualizer({ getFrequencyData, isPlaying }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  useEffect(() => {
    if (meshRef.current) {
      originalPositions.current = new Float32Array(meshRef.current.geometry.attributes.position.array as Float32Array);
    }
  }, []);
  useFrame((state) => {
    if (!meshRef.current || !isPlaying || !originalPositions.current) return;
    const frequencyData = getFrequencyData();
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const segments = 64;
    for (let i = 0; i < pos.length / 3; i++) {
      const ix = i % (segments + 1);
      const iy = Math.floor(i / (segments + 1));
      const freqIndex = Math.floor((ix / segments) * frequencyData.length);
      const freq = frequencyData[freqIndex] / 255;
      pos[i * 3 + 2] = freq * 3 + Math.sin(state.clock.elapsedTime * 2 + ix * 0.3) * 0.5 + Math.cos(state.clock.elapsedTime * 1.5 + iy * 0.3) * 0.3;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[16, 10, 64, 64]} />
      <meshStandardMaterial color="#00FFFF" wireframe emissive="#00FFFF" emissiveIntensity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PulseVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
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
          <meshBasicMaterial color={i % 2 === 0 ? "#FF00FF" : "#00FFFF"} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ============ NEW GENRE-AWARE THEMES ============

// Neon City — Electronic/Pop/Dance
function NeonCityVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const containerRef = useRef<THREE.Group>(null);
  const gridRef = useRef<any>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Grid floor
  const gridPositions = useMemo(() => {
    const lines: number[] = [];
    const size = 20, divisions = 40;
    const step = size / divisions;
    for (let i = -size / 2; i <= size / 2; i += step) {
      lines.push(-size / 2, 0, i, size / 2, 0, i);
      lines.push(i, 0, -size / 2, i, 0, size / 2);
    }
    return new Float32Array(lines);
  }, []);

  useFrame((state) => {
    if (!containerRef.current || !isPlaying) return;
    const frequencyData = getFrequencyData();

    // Animate grid scroll
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 2) % 0.5;
    }

    // Animate neon rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const freq = frequencyData[Math.floor((i / 6) * frequencyData.length)] / 255;
        const s = 1 + freq * 1.5;
        ring.scale.set(s, s, 1);
        ring.rotation.z = state.clock.elapsedTime * (i % 2 === 0 ? 0.5 : -0.3);
        ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.4 + freq * 0.6;
      });
    }
  });

  return (
    <group ref={containerRef}>
      {/* Grid floor using lineSegments to avoid SVG conflict */}
      <lineSegments ref={gridRef} position={[0, -3, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={gridPositions.length / 3} array={gridPositions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#FF00FF" transparent opacity={0.3} />
      </lineSegments>

      {/* Neon rings */}
      <group ref={ringsRef}>
        {[0.8, 1.4, 2.0, 2.6, 3.2, 3.8].map((r, i) => (
          <mesh key={i} position={[0, 0, -2]}>
            <torusGeometry args={[r, 0.03, 8, 64]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#FF00FF" : i % 3 === 1 ? "#00FFFF" : "#FF69B4"}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient glow lights */}
      <pointLight position={[5, 3, 0]} intensity={2} color="#FF00FF" distance={15} />
      <pointLight position={[-5, 3, 0]} intensity={2} color="#00FFFF" distance={15} />
    </group>
  );
}

// Retro Vinyl — Hip-Hop/Lo-Fi/R&B
function RetroVinylVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const discRef = useRef<THREE.Mesh>(null);
  const grooveRef = useRef<THREE.Points>(null);

  const grooveParticles = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 20;
      const radius = 0.3 + (i / count) * 2.2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.05;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!isPlaying) return;
    const avg = getAverageFrequency();
    const frequencyData = getFrequencyData();

    if (discRef.current) {
      discRef.current.rotation.y += 0.02 + avg * 0.03;
    }

    if (grooveRef.current) {
      const pos = grooveRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        const freqIndex = Math.floor((i / (pos.length / 3)) * frequencyData.length);
        const freq = frequencyData[freqIndex] / 255;
        pos[i * 3 + 1] = 0.05 + freq * 0.4; // Bass pushes grooves up
      }
      grooveRef.current.geometry.attributes.position.needsUpdate = true;
      grooveRef.current.rotation.y += 0.02 + avg * 0.03;
    }
  });

  return (
    <group>
      {/* Vinyl disc */}
      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.6, 2.6, 0.05, 64]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Label center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
        <meshStandardMaterial color="#D4A017" metalness={0.6} roughness={0.4} emissive="#D4A017" emissiveIntensity={0.3} />
      </mesh>

      {/* Groove particles */}
      <points ref={grooveRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={grooveParticles.length / 3} array={grooveParticles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#D4A017" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </points>

      {/* Warm lighting */}
      <pointLight position={[0, 5, 0]} intensity={3} color="#D4A017" distance={12} />
      <pointLight position={[3, 2, 3]} intensity={1} color="#8B6914" distance={10} />
    </group>
  );
}

// Deep Space — Ambient/Classical/Atmospheric
function DeepSpaceVisualizer({ getFrequencyData, getAverageFrequency, isPlaying }: any) {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef = useRef<THREE.Points>(null);
  const particleCount = 2500;

  const [starPositions, nebulaPositions, nebulaColors] = useMemo(() => {
    const sPos = new Float32Array(particleCount * 3);
    const nPos = new Float32Array(800 * 3);
    const nCol = new Float32Array(800 * 3);
    for (let i = 0; i < particleCount; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 30;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    for (let i = 0; i < 800; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 5;
      nPos[i * 3] = Math.cos(angle) * radius;
      nPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      nPos[i * 3 + 2] = Math.sin(angle) * radius;
      const t = Math.random();
      nCol[i * 3] = t < 0.5 ? 0.2 : 0.5; // blue to violet
      nCol[i * 3 + 1] = 0.1;
      nCol[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }
    return [sPos, nPos, nCol];
  }, []);

  useFrame((state) => {
    if (!isPlaying) return;
    const avg = getAverageFrequency();
    const frequencyData = getFrequencyData();

    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }

    if (nebulaRef.current) {
      const pos = nebulaRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 800; i++) {
        const freqIndex = Math.floor((i / 800) * frequencyData.length);
        const freq = frequencyData[freqIndex] / 255;
        pos[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i * 0.01) * 0.005 * (1 + freq);
      }
      nebulaRef.current.geometry.attributes.position.needsUpdate = true;
      nebulaRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <group>
      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={starPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#FFFFFF" transparent opacity={0.8} />
      </points>

      {/* Nebula */}
      <points ref={nebulaRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={800} array={nebulaPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={800} array={nebulaColors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.12} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </points>

      {/* Deep space lights */}
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#4400AA" distance={20} />
      <pointLight position={[5, 5, -5]} intensity={0.8} color="#0044FF" distance={15} />
    </group>
  );
}

// ============ SCENE & CANVAS ============

function VisualizerScene({ mode, audioElement, isPlaying }: { mode: VisualizerMode; audioElement: HTMLAudioElement | null; isPlaying: boolean }) {
  const { getFrequencyData, getAverageFrequency } = useAudioAnalyzer(audioElement);
  const props = { getFrequencyData, getAverageFrequency, isPlaying };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#7FFF00" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF00FF" />

      {mode === "aurora" && <AuroraVisualizer {...props} />}
      {mode === "waves" && <WaveVisualizer {...props} />}
      {mode === "sphere" && <SphereVisualizer {...props} />}
      {mode === "terrain" && <TerrainVisualizer {...props} />}
      {mode === "pulse" && <PulseVisualizer {...props} />}
      {mode === "neon" && <NeonCityVisualizer {...props} />}
      {mode === "vinyl" && <RetroVinylVisualizer {...props} />}
      {mode === "space" && <DeepSpaceVisualizer {...props} />}
    </>
  );
}

function OptimizedCanvas({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 5, 20]} />
      {children}
    </Canvas>
  );
}

export function AudioVisualizer3D({ audioElement, isPlaying, genre, mood }: AudioVisualizer3DProps) {
  const [mode, setMode] = useState<VisualizerMode>("aurora");
  const [autoMode, setAutoMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-select theme based on genre/mood
  useEffect(() => {
    if (!autoMode) return;
    const suggested = getAutoTheme(genre, mood);
    if (suggested) setMode(suggested);
  }, [genre, mood, autoMode]);

  const allModes: { id: VisualizerMode; label: string; icon: any }[] = [
    { id: "aurora", label: "Aurora", icon: Sparkles },
    { id: "waves", label: "Waves", icon: Waves },
    { id: "sphere", label: "Sphere", icon: Circle },
    { id: "terrain", label: "Terrain", icon: Mountain },
    { id: "pulse", label: "Pulse", icon: Zap },
    { id: "neon", label: "Neon City", icon: Building2 },
    { id: "vinyl", label: "Vinyl", icon: Disc3 },
    { id: "space", label: "Deep Space", icon: Orbit },
  ];

  const handleModeChange = (id: VisualizerMode) => {
    setMode(id);
    setAutoMode(false); // Manual override disables auto
  };

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
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black/90 rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? "w-screen h-screen rounded-none" : "w-full h-64"
      }`}
    >
      {/* Mode selector */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 bg-black/60 backdrop-blur-sm rounded-full border border-primary/20 flex-wrap justify-center max-w-[95%]">
        {allModes.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={mode === id ? "default" : "ghost"}
            size="sm"
            onClick={() => handleModeChange(id)}
            className={`h-7 px-2 rounded-full transition-all ${
              mode === id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3 mr-1" />
            <span className="text-[10px] font-medium hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Auto-theme badge */}
      {autoMode && getAutoTheme(genre, mood) && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 bg-primary/20 backdrop-blur-sm rounded-full text-[10px] text-primary border border-primary/30">
          <Palette className="h-3 w-3" /> Auto: {genre || mood}
        </div>
      )}

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 h-8 w-8 bg-black/60 backdrop-blur-sm border border-primary/20 rounded-full hover:bg-primary/20"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4 text-foreground" /> : <Maximize2 className="h-4 w-4 text-foreground" />}
      </Button>

      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <OptimizedCanvas>
          <VisualizerScene mode={mode} audioElement={audioElement} isPlaying={isPlaying} />
        </OptimizedCanvas>
      </Suspense>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-accent/20 to-transparent pointer-events-none" />
    </div>
  );
}
