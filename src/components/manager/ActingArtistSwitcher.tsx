import { useActingArtist } from "@/contexts/ActingArtistContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronDown, User, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ActingArtistSwitcher({ compact = false }: { compact?: boolean }) {
  const { canDelegate, roster, actingArtistId, actingArtistName, setActingArtist, isDelegated } =
    useActingArtist();
  const navigate = useNavigate();

  if (!canDelegate || roster.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isDelegated ? "default" : "outline"}
          size="sm"
          className={
            isDelegated
              ? "bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 text-white h-9"
              : "h-9"
          }
        >
          <Users className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline text-xs">
            {isDelegated ? `Acting as: ${actingArtistName}` : "Act on behalf of…"}
          </span>
          <span className="sm:hidden text-xs">
            {isDelegated ? actingArtistName : "Act as"}
          </span>
          {isDelegated && (
            <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px] bg-white/20 text-white border-0">
              LIVE
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Manager · Enterprise
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setActingArtist(null)}>
          <User className="w-4 h-4 mr-2" />
          <div className="flex-1">
            <div className="text-sm">Myself (manager)</div>
            <div className="text-[10px] text-muted-foreground">Own uploads &amp; analytics</div>
          </div>
          {!isDelegated && <Badge variant="outline" className="text-[9px]">active</Badge>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Your roster ({roster.length})
        </DropdownMenuLabel>
        {roster.map((r) => (
          <DropdownMenuItem
            key={r.artist_id}
            onClick={() => setActingArtist(r.artist_id)}
            className="cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold mr-2">
              {r.artist_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 truncate">{r.artist_name}</div>
            {actingArtistId === r.artist_id && (
              <Badge variant="outline" className="text-[9px]">active</Badge>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/manager-hq")} className="cursor-pointer">
          <ExternalLink className="w-3 h-3 mr-2" />
          <span className="text-xs">Manager HQ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
