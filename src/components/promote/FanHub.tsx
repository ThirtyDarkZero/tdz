import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Mail, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { CSVFanImport } from "./CSVFanImport";

const PAGE_SIZE = 25;

export function FanHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["artist-contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("artist_contacts")
        .select("*")
        .eq("artist_id", user.id)
        .order("imported_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = (contacts || []).filter((c: any) => {
    const matchesSearch = !search || 
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || c.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = {
    total: contacts?.length || 0,
    subscribed: contacts?.filter((c: any) => c.subscribed !== false).length || 0,
    imported: contacts?.filter((c: any) => c.source === "csv_import").length || 0,
  };

  const removeContact = async (id: string) => {
    const { error } = await (supabase as any).from("artist_contacts").delete().eq("id", id);
    if (error) { toast.error("Failed to remove contact"); return; }
    toast.success("Contact removed");
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
    setSelectedContact(null);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="list">Fan List</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <CSVFanImport />
        </TabsContent>

        <TabsContent value="list" className="mt-6 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Contacts", value: stats.total, color: "text-primary" },
              { label: "Subscribed", value: stats.subscribed, color: "text-green-500" },
              { label: "Imported", value: stats.imported, color: "text-blue-400" },
            ].map((s) => (
              <Card key={s.label} className="p-4 bg-card/50 border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
            </div>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="csv_import">CSV Import</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="tdz_follow">TDZ Follow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contacts Table */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No contacts found. Import fans via CSV or add them manually.</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("import")}>Import CSV</Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 bg-muted/20">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell">City</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Source</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((contact: any) => (
                    <tr key={contact.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {contact.first_name || contact.last_name
                              ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                              : contact.email.split("@")[0]}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{contact.email}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{contact.city || "—"}</td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {contact.source === "csv_import" ? "CSV" : contact.source || "Manual"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">
                        {contact.imported_at ? format(new Date(contact.imported_at), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedContact(contact)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeContact(contact.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filtered.length} contacts · Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <SheetContent className="bg-card border-border/30">
          <SheetHeader>
            <SheetTitle>Contact Details</SheetTitle>
          </SheetHeader>
          {selectedContact && (
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {(selectedContact.first_name?.[0] || selectedContact.email[0]).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedContact.first_name || ""} {selectedContact.last_name || ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <DetailRow label="City" value={selectedContact.city} />
                <DetailRow label="Phone" value={selectedContact.phone} />
                <DetailRow label="Source" value={selectedContact.source} />
                <DetailRow label="Status" value={selectedContact.subscribed !== false ? "Subscribed" : "Unsubscribed"} />
                <DetailRow label="Imported" value={selectedContact.imported_at ? format(new Date(selectedContact.imported_at), "MMM d, yyyy h:mm a") : "—"} />
              </div>
              <Button variant="destructive" className="w-full" onClick={() => removeContact(selectedContact.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Remove Contact
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between py-2 border-b border-border/10">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value || "—"}</span>
  </div>
);
