import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";

interface Scene3DProps {
  children: React.ReactNode;
  className?: string;
  enableControls?: boolean;
}

export function Scene3D({ children, className = "", enableControls = false }: Scene3DProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        
        <Suspense fallback={null}>
          {children}
        </Suspense>
        
        {enableControls && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  );
}
