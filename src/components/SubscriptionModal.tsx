import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Music, Headphones, Download, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  { icon: Music, text: "Unlimited full-length streaming" },
  { icon: Headphones, text: "HD & Dolby Atmos audio quality" },
  { icon: Download, text: "Offline downloads" },
  { icon: Star, text: "Ad-free experience" },
];

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card-premium border-primary/30">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
            <Music className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-black">
            Unlock Full Access
          </DialogTitle>
          <DialogDescription className="text-base">
            Your 30-second preview has ended. Subscribe to enjoy unlimited streaming!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price */}
          <div className="text-center">
            <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1 text-lg font-bold shadow-glow">
              Only $12/month
            </Badge>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
                <Check className="w-4 h-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-primary via-primary-glow to-secondary hover:opacity-90 shadow-glow py-6 text-lg font-bold"
            >
              Start Subscription
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Continue with Previews
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No commitment required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
