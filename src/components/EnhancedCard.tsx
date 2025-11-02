import { ReactNode, useState, CSSProperties } from "react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent";
  enable3D?: boolean;
  style?: CSSProperties;
}

export function EnhancedCard({ 
  children, 
  className = "", 
  glowColor = "primary",
  enable3D = true,
  style
}: EnhancedCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  };

  const glowColors = {
    primary: "hsl(var(--primary) / 0.5)",
    secondary: "hsl(var(--secondary) / 0.5)",
    accent: "hsl(var(--accent) / 0.5)",
  };

  return (
    <div
      className={cn(
        "relative perspective-2000 transform-3d group",
        className
      )}
      style={{
        ...style,
        ...(enable3D && isHovered
          ? {
              transform: `
                rotateY(${(mousePosition.x - 0.5) * 20}deg) 
                rotateX(${-(mousePosition.y - 0.5) * 20}deg)
                translateZ(20px)
              `,
              transition: "transform 0.1s ease-out",
            }
          : undefined)
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0.5, y: 0.5 });
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, ${glowColors[glowColor]}, transparent 70%)`,
        }}
      />
      
      {/* Card content */}
      <Card className="glass-card-premium relative overflow-hidden transition-all duration-300 group-hover:border-primary/60">
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, hsl(var(--foreground) / 0.1), transparent 50%)`,
          }}
        />
        
        <div className="relative z-10">{children}</div>
      </Card>
    </div>
  );
}
