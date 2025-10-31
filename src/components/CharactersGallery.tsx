import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2, Trash2, Video as VideoIcon } from "lucide-react";
import { useProject, Character } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const CharactersGallery = () => {
  const { characters, updateCharacter, deleteCharacter, loading } = useProject();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPreviews = async () => {
      const urls: Record<string, string> = {};
      
      for (const character of characters) {
        try {
          const { data } = await supabase.storage
            .from("characters")
            .createSignedUrl(character.media_path, 3600);
          
          if (data?.signedUrl) {
            urls[character.id] = data.signedUrl;
          }
        } catch (error) {
          console.error('Error loading preview:', error);
        }
      }
      
      setPreviewUrls(urls);
    };

    if (characters.length > 0) {
      loadPreviews();
    }
  }, [characters]);

  const handleApprove = async (character: Character) => {
    await updateCharacter(character.id, { is_approved: !character.is_approved });
  };

  const handleStartEdit = (character: Character) => {
    setEditingId(character.id);
    setEditName(character.name);
  };

  const handleSaveEdit = async (characterId: string) => {
    if (editName.trim()) {
      await updateCharacter(characterId, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
    }
  };

  const handleDelete = async (characterId: string) => {
    if (confirm("Are you sure you want to delete this character?")) {
      await deleteCharacter(characterId);
    }
  };

  if (characters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Your Characters</h3>
      <div className="grid grid-cols-2 gap-3">
        {characters.map((character) => (
          <Card key={character.id} className="glass-card p-2 space-y-2">
            {/* Preview */}
            <div className="relative aspect-square rounded-md overflow-hidden bg-muted/30">
              {previewUrls[character.id] ? (
                character.media_type === 'image' ? (
                  <img
                    src={previewUrls[character.id]}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={previewUrls[character.id]}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="gap-1">
                        <VideoIcon className="w-3 h-3" />
                        Video
                      </Badge>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              )}
              
              {/* Approval Badge */}
              {character.is_approved && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-500/90 text-white gap-1">
                    <Check className="w-3 h-3" />
                    Approved
                  </Badge>
                </div>
              )}
            </div>

            {/* Name Edit */}
            {editingId === character.id ? (
              <div className="flex gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => handleSaveEdit(character.id)}
                >
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium truncate">{character.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleStartEdit(character)}
                  disabled={loading}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={character.is_approved ? "outline" : "default"}
                className="flex-1 h-7 text-xs gap-1"
                onClick={() => handleApprove(character)}
                disabled={loading}
              >
                {character.is_approved ? (
                  <>
                    <X className="w-3 h-3" />
                    Unapprove
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2"
                onClick={() => handleDelete(character.id)}
                disabled={loading}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
