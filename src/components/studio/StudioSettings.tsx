import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArtistProfileEditor } from "@/components/ArtistProfileEditor";
import { ArtistPayoutSettings } from "@/components/ArtistPayoutSettings";
import { CollaboratorsList } from "@/components/CollaboratorsList";
import { CollaboratorInviteDialog } from "@/components/CollaboratorInviteDialog";
import { FeatureGate } from "@/components/FeatureGate";
import { Users } from "lucide-react";

export const StudioSettings = () => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [collaboratorsKey, setCollaboratorsKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, payouts, and team</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            Artist Profile
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-background">
            Payouts
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-background">
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <ArtistProfileEditor />
        </TabsContent>

        <TabsContent value="payouts" className="mt-0">
          <ArtistPayoutSettings />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <FeatureGate feature="collaborationTools">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                  <Users className="h-4 w-4" />
                  Invite Collaborator
                </Button>
              </div>
              <CollaboratorsList key={collaboratorsKey} />
            </div>
          </FeatureGate>

          <CollaboratorInviteDialog 
            open={showInviteDialog} 
            onOpenChange={setShowInviteDialog}
            onInviteSent={() => setCollaboratorsKey(prev => prev + 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
