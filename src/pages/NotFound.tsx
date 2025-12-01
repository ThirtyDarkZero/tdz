import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Music, Search } from "lucide-react";
import tdzLogo from "@/assets/tdz-logo.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Epic background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Logo */}
        <img 
          src={tdzLogo} 
          alt="TDZ" 
          className="h-16 w-auto mx-auto mb-8 opacity-80"
          style={{ mixBlendMode: 'screen' }}
        />
        
        {/* 404 Number with glow */}
        <div className="relative mb-6">
          <h1 className="text-[150px] sm:text-[200px] font-black leading-none bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute inset-0 bg-primary/20 blur-[80px] -z-10" />
        </div>
        
        {/* Message */}
        <div className="space-y-4 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Track Not Found
          </h2>
          <p className="text-muted-foreground text-lg">
            Looks like this page doesn't exist in our catalog.
            <br />
            Let's get you back to the music.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg"
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button 
            size="lg"
            onClick={() => navigate("/discover")}
            className="gap-2 shadow-glow w-full sm:w-auto"
          >
            <Music className="w-4 h-4" />
            Discover Music
          </Button>
          <Button 
            size="lg"
            onClick={() => navigate("/")}
            variant="secondary"
            className="gap-2 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Fun message */}
        <p className="text-sm text-muted-foreground mt-12">
          Error code: <span className="font-mono text-primary">TRACK_NOT_FOUND_404</span>
        </p>
      </div>
    </div>
  );
};

export default NotFound;