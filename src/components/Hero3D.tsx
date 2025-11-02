import { Scene3D } from "./3D/Scene3D";
import { FloatingMusicNotes } from "./3D/FloatingMusicNotes";
import { ParticleField } from "./3D/ParticleField";

export function Hero3D() {
  return (
    <div className="absolute inset-0 opacity-40 pointer-events-none">
      <Scene3D>
        <ParticleField />
        <FloatingMusicNotes />
      </Scene3D>
    </div>
  );
}
