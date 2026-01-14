import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Globe, Shield, Plus, Trash2, Check, X, Users, AlertCircle, 
  CheckCircle2, Music, Save, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Territory {
  code: string;
  name: string;
  region: string;
}

interface TrackTerritory {
  id?: string;
  territory_code: string;
  territory_name: string;
  is_available: boolean;
  restriction_reason?: string;
}

interface RightsSplit {
  id?: string;
  rights_type: 'master' | 'publishing' | 'performance';
  holder_name: string;
  holder_email?: string;
  split_percentage: number;
  pro_affiliation?: string;
  ipi_number?: string;
  is_verified: boolean;
}

interface TerritoryRightsManagerProps {
  trackId: string;
  trackTitle: string;
  onClose?: () => void;
}

const REGIONS = {
  worldwide: "Worldwide",
  northAmerica: "North America",
  europe: "Europe",
  asia: "Asia Pacific",
  latinAmerica: "Latin America",
  africa: "Africa",
  middleEast: "Middle East"
};

const TERRITORIES: Territory[] = [
  { code: "US", name: "United States", region: "northAmerica" },
  { code: "CA", name: "Canada", region: "northAmerica" },
  { code: "MX", name: "Mexico", region: "latinAmerica" },
  { code: "GB", name: "United Kingdom", region: "europe" },
  { code: "DE", name: "Germany", region: "europe" },
  { code: "FR", name: "France", region: "europe" },
  { code: "ES", name: "Spain", region: "europe" },
  { code: "IT", name: "Italy", region: "europe" },
  { code: "NL", name: "Netherlands", region: "europe" },
  { code: "SE", name: "Sweden", region: "europe" },
  { code: "NO", name: "Norway", region: "europe" },
  { code: "DK", name: "Denmark", region: "europe" },
  { code: "PL", name: "Poland", region: "europe" },
  { code: "JP", name: "Japan", region: "asia" },
  { code: "KR", name: "South Korea", region: "asia" },
  { code: "CN", name: "China", region: "asia" },
  { code: "AU", name: "Australia", region: "asia" },
  { code: "NZ", name: "New Zealand", region: "asia" },
  { code: "IN", name: "India", region: "asia" },
  { code: "SG", name: "Singapore", region: "asia" },
  { code: "BR", name: "Brazil", region: "latinAmerica" },
  { code: "AR", name: "Argentina", region: "latinAmerica" },
  { code: "CL", name: "Chile", region: "latinAmerica" },
  { code: "CO", name: "Colombia", region: "latinAmerica" },
  { code: "ZA", name: "South Africa", region: "africa" },
  { code: "NG", name: "Nigeria", region: "africa" },
  { code: "EG", name: "Egypt", region: "middleEast" },
  { code: "AE", name: "United Arab Emirates", region: "middleEast" },
  { code: "SA", name: "Saudi Arabia", region: "middleEast" },
  { code: "IL", name: "Israel", region: "middleEast" },
];

const PRO_OPTIONS = [
  { value: "bmi", label: "BMI" },
  { value: "ascap", label: "ASCAP" },
  { value: "sesac", label: "SESAC" },
  { value: "prs", label: "PRS (UK)" },
  { value: "gema", label: "GEMA (Germany)" },
  { value: "sacem", label: "SACEM (France)" },
  { value: "socan", label: "SOCAN (Canada)" },
  { value: "apra", label: "APRA (Australia)" },
  { value: "jasrac", label: "JASRAC (Japan)" },
  { value: "other", label: "Other" },
];

export const TerritoryRightsManager = ({ trackId, trackTitle, onClose }: TerritoryRightsManagerProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [territories, setTerritories] = useState<TrackTerritory[]>([]);
  const [rightsSplits, setRightsSplits] = useState<RightsSplit[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [newSplit, setNewSplit] = useState<RightsSplit>({
    rights_type: 'master',
    holder_name: '',
    holder_email: '',
    split_percentage: 0,
    pro_affiliation: '',
    ipi_number: '',
    is_verified: false
  });
  const [showAddSplit, setShowAddSplit] = useState(false);

  useEffect(() => {
    loadData();
  }, [trackId]);

  const loadData = async () => {
    try {
      // Load territories
      const { data: territoryData } = await supabase
        .from("track_territories")
        .select("*")
        .eq("track_id", trackId);

      // Load rights splits
      const { data: splitsData } = await supabase
        .from("track_rights_splits")
        .select("*")
        .eq("track_id", trackId);

      // If no territories exist, initialize with all available
      if (!territoryData || territoryData.length === 0) {
        const initialTerritories = TERRITORIES.map(t => ({
          territory_code: t.code,
          territory_name: t.name,
          is_available: true
        }));
        setTerritories(initialTerritories);
      } else {
        setTerritories(territoryData);
      }

      setRightsSplits((splitsData || []).map(s => ({
        ...s,
        rights_type: s.rights_type as 'master' | 'publishing' | 'performance'
      })));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load territory data");
    } finally {
      setLoading(false);
    }
  };

  const handleTerritoryToggle = (code: string) => {
    setTerritories(prev => prev.map(t => 
      t.territory_code === code ? { ...t, is_available: !t.is_available } : t
    ));
  };

  const handleRegionToggle = (region: string, available: boolean) => {
    const regionCodes = TERRITORIES.filter(t => t.region === region).map(t => t.code);
    setTerritories(prev => prev.map(t => 
      regionCodes.includes(t.territory_code) ? { ...t, is_available: available } : t
    ));
  };

  const handleSelectAll = (available: boolean) => {
    setTerritories(prev => prev.map(t => ({ ...t, is_available: available })));
  };

  const handleAddSplit = () => {
    if (!newSplit.holder_name || newSplit.split_percentage <= 0) {
      toast.error("Please enter holder name and percentage");
      return;
    }

    const currentTotal = rightsSplits
      .filter(s => s.rights_type === newSplit.rights_type)
      .reduce((sum, s) => sum + s.split_percentage, 0);

    if (currentTotal + newSplit.split_percentage > 100) {
      toast.error(`Total ${newSplit.rights_type} split cannot exceed 100%`);
      return;
    }

    setRightsSplits(prev => [...prev, { ...newSplit, id: crypto.randomUUID() }]);
    setNewSplit({
      rights_type: 'master',
      holder_name: '',
      holder_email: '',
      split_percentage: 0,
      pro_affiliation: '',
      ipi_number: '',
      is_verified: false
    });
    setShowAddSplit(false);
  };

  const handleRemoveSplit = (id: string) => {
    setRightsSplits(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save territories - delete existing and insert new
      await supabase
        .from("track_territories")
        .delete()
        .eq("track_id", trackId);

      const territoryInserts = territories.map(t => ({
        track_id: trackId,
        territory_code: t.territory_code,
        territory_name: t.territory_name,
        is_available: t.is_available,
        restriction_reason: t.restriction_reason
      }));

      await supabase
        .from("track_territories")
        .insert(territoryInserts);

      // Save rights splits - delete existing and insert new
      await supabase
        .from("track_rights_splits")
        .delete()
        .eq("track_id", trackId);

      if (rightsSplits.length > 0) {
        const splitInserts = rightsSplits.map(s => ({
          track_id: trackId,
          rights_type: s.rights_type,
          holder_name: s.holder_name,
          holder_email: s.holder_email,
          split_percentage: s.split_percentage,
          pro_affiliation: s.pro_affiliation,
          ipi_number: s.ipi_number,
          is_verified: s.is_verified
        }));

        await supabase
          .from("track_rights_splits")
          .insert(splitInserts);
      }

      toast.success("Territory & rights saved successfully");
      onClose?.();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getSplitTotal = (type: string) => {
    return rightsSplits
      .filter(s => s.rights_type === type)
      .reduce((sum, s) => sum + s.split_percentage, 0);
  };

  const filteredTerritories = selectedRegion === "all" 
    ? TERRITORIES 
    : TERRITORIES.filter(t => t.region === selectedRegion);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Territory & Rights
          </h2>
          <p className="text-sm text-muted-foreground">for "{trackTitle}"</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="territories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="territories" className="gap-2">
            <Globe className="w-4 h-4" />
            Territories
          </TabsTrigger>
          <TabsTrigger value="rights" className="gap-2">
            <Shield className="w-4 h-4" />
            Rights Splits
          </TabsTrigger>
        </TabsList>

        {/* Territories Tab */}
        <TabsContent value="territories" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Label className="text-sm font-medium">Quick Actions:</Label>
              <Button variant="outline" size="sm" onClick={() => handleSelectAll(true)}>
                <Check className="w-4 h-4 mr-1" />
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSelectAll(false)}>
                <X className="w-4 h-4 mr-1" />
                Disable All
              </Button>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {Object.entries(REGIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm">
                <strong>{territories.filter(t => t.is_available).length}</strong> of {TERRITORIES.length} territories enabled
              </span>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredTerritories.map(territory => {
                  const trackTerritory = territories.find(t => t.territory_code === territory.code);
                  const isAvailable = trackTerritory?.is_available ?? true;
                  
                  return (
                    <div 
                      key={territory.code}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        isAvailable 
                          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                          : 'bg-muted/50 border-border hover:bg-muted'
                      }`}
                      onClick={() => handleTerritoryToggle(territory.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{territory.code}</span>
                          <span className="text-sm">{territory.name}</span>
                        </div>
                        <Switch 
                          checked={isAvailable}
                          onCheckedChange={() => handleTerritoryToggle(territory.code)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Rights Splits Tab */}
        <TabsContent value="rights" className="space-y-4">
          {/* Split Summary */}
          <div className="grid grid-cols-3 gap-4">
            {(['master', 'publishing', 'performance'] as const).map(type => (
              <Card key={type} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <Badge variant={getSplitTotal(type) === 100 ? "default" : "destructive"}>
                    {getSplitTotal(type)}%
                  </Badge>
                </div>
                <Progress value={getSplitTotal(type)} className="h-2" />
                {getSplitTotal(type) !== 100 && getSplitTotal(type) > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Must equal 100%
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Add Split Button */}
          <Dialog open={showAddSplit} onOpenChange={setShowAddSplit}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Rights Holder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Rights Holder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rights Type *</Label>
                    <Select 
                      value={newSplit.rights_type} 
                      onValueChange={(v: any) => setNewSplit({ ...newSplit, rights_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">Master Rights</SelectItem>
                        <SelectItem value="publishing">Publishing Rights</SelectItem>
                        <SelectItem value="performance">Performance Rights</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Split Percentage *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newSplit.split_percentage}
                      onChange={(e) => setNewSplit({ ...newSplit, split_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Holder Name *</Label>
                  <Input
                    value={newSplit.holder_name}
                    onChange={(e) => setNewSplit({ ...newSplit, holder_name: e.target.value })}
                    placeholder="Rights holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newSplit.holder_email}
                    onChange={(e) => setNewSplit({ ...newSplit, holder_email: e.target.value })}
                    placeholder="holder@email.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PRO Affiliation</Label>
                    <Select 
                      value={newSplit.pro_affiliation || ''} 
                      onValueChange={(v) => setNewSplit({ ...newSplit, pro_affiliation: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select PRO" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRO_OPTIONS.map(pro => (
                          <SelectItem key={pro.value} value={pro.value}>{pro.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>IPI Number</Label>
                    <Input
                      value={newSplit.ipi_number}
                      onChange={(e) => setNewSplit({ ...newSplit, ipi_number: e.target.value })}
                      placeholder="IPI/CAE Number"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddSplit(false)}>Cancel</Button>
                <Button onClick={handleAddSplit}>Add Holder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Existing Splits */}
          {rightsSplits.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Rights Holders Added</h3>
              <p className="text-sm text-muted-foreground">
                Add rights holders to define master, publishing, and performance splits
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {(['master', 'publishing', 'performance'] as const).map(type => {
                const typeSplits = rightsSplits.filter(s => s.rights_type === type);
                if (typeSplits.length === 0) return null;
                
                return (
                  <Card key={type} className="p-4">
                    <h4 className="font-semibold mb-3 capitalize flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      {type} Rights
                    </h4>
                    <div className="space-y-2">
                      {typeSplits.map(split => (
                        <div 
                          key={split.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{split.holder_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {split.pro_affiliation?.toUpperCase() || 'No PRO'} 
                                {split.ipi_number && ` · IPI: ${split.ipi_number}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-lg font-bold">
                              {split.split_percentage}%
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveSplit(split.id!)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Validation Warning */}
          {rightsSplits.length > 0 && (
            getSplitTotal('master') !== 100 || 
            getSplitTotal('publishing') !== 100 || 
            getSplitTotal('performance') !== 100
          ) && (
            <Card className="p-4 border-amber-500/50 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-500">Incomplete Rights Allocation</p>
                  <p className="text-sm text-muted-foreground">
                    Each rights type (Master, Publishing, Performance) should total 100% for proper royalty distribution.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
