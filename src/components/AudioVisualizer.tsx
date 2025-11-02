import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

export const AudioVisualizer = ({ audioElement, isPlaying }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // Only create audio context and source once
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      } catch (error) {
        // Audio element already connected, this is okay in strict mode
        console.warn("Audio element already connected to AudioContext");
        return;
      }
    }

    const analyser = audioContextRef.current.createAnalyser();
    sourceRef.current.connect(analyser);
    analyser.connect(audioContextRef.current.destination);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    return () => {
      if (analyser) {
        analyser.disconnect();
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArrayRef.current!.length) * 2.5;
      let x = 0;
      
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const barHeight = (dataArrayRef.current![i] / 255) * canvas.height;
        
        const hue = (i / dataArrayRef.current!.length) * 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full h-full rounded-lg"
    />
  );
};
