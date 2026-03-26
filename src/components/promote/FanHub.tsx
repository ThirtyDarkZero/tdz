import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users, Search, Trash2, Eye, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, Sparkles, Loader2,
  Tag, UserPlus, Download, Mail, CheckSquare, X, Pencil, Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { CSVFanImport } from "./CSVFanImport";

const PAGE_SIZE = 25;

type SortField = "name" | "email" | "city" | "source" | "imported_at";
type SortDir = "asc" | "desc";

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  phone: string | null;
  source: string | null;
  subscribed: boolean | null;
  tags: string[] | null;
  imported_at: string | null;
  artist_id: string;
}

export function FanHub() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [sortField, setSortField] = useState<SortField>("imported_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newTag, setNewTag] = useState("");

  // New contact form
  const [newContact, setNewContact] = useState({ email: "", first_name: "", last_name: "", city: "", phone: "" });

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
      return (data || []) as Contact[];
    },
    enabled: !!user,
  });

  // Extract all unique tags
  const allTags = Array.from(new Set((contacts || []).flatMap((c) => c.tags || [])));

  // Filter
  const filtered = (contacts || []).filter((c) => {
    const matchesSearch = !search ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || c.source === sourceFilter;
    const matchesTag = tagFilter === "all" || (c.tags || []).includes(tagFilter);
    return matchesSearch && matchesSource && matchesTag;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = "", bVal = "";
    switch (sortField) {
      case "name": aVal = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase(); bVal = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase(); break;
      case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
      case "city": aVal = (a.city || "").toLowerCase(); bVal = (b.city || "").toLowerCase(); break;
      case "source": aVal = (a.source || "").toLowerCase(); bVal = (b.source || "").toLowerCase(); break;
      case "imported_at": aVal = a.imported_at || ""; bVal = b.imported_at || ""; break;
    }
    const cmp = aVal.localeCompare(bVal);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = {
    total: contacts?.length || 0,
    subscribed: contacts?.filter((c) => c.subscribed !== false).length || 0,
    cities: new Set((contacts || []).map((c) => c.city).filter(Boolean)).size,
    tagged: contacts?.filter((c) => (c.tags || []).length > 0).length || 0,
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(c => c.id)));
  };

  // Remove contact
  const removeContact = async (id: string) => {
    const { error } = await (supabase as any).from("artist_contacts").delete().eq("id", id);
    if (error) { toast.error("Failed to remove contact"); return; }
    toast.success("Contact removed");
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
    setSelectedContact(null);
    setEditingContact(null);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await (supabase as any).from("artist_contacts").delete().in("id", ids);
    if (error) { toast.error("Failed to delete contacts"); return; }
    toast.success(`Deleted ${ids.length} contacts`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
  };

  // Bulk tag
  const bulkTag = async (tag: string) => {
    if (selectedIds.size === 0 || !tag) return;
    const ids = Array.from(selectedIds);
    const updates = (contacts || []).filter(c => ids.includes(c.id)).map(c => ({
      id: c.id,
      artist_id: c.artist_id,
      email: c.email,
      tags: Array.from(new Set([...(c.tags || []), tag])),
    }));
    const { error } = await (supabase as any).from("artist_contacts").upsert(updates);
    if (error) { toast.error("Failed to tag contacts"); return; }
    toast.success(`Tagged ${ids.length} contacts with "${tag}"`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
  };

  // Add contact manually
  const addContact = async () => {
    if (!user || !newContact.email.includes("@")) { toast.error("Valid email required"); return; }
    const { error } = await (supabase as any).from("artist_contacts").insert({
      artist_id: user.id,
      email: newContact.email,
      first_name: newContact.first_name || null,
      last_name: newContact.last_name || null,
      city: newContact.city || null,
      phone: newContact.phone || null,
      source: "manual",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Contact added");
    setNewContact({ email: "", first_name: "", last_name: "", city: "", phone: "" });
    setAddOpen(false);
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
  };

  // Save edited contact
  const saveContact = async () => {
    if (!editingContact) return;
    const { error } = await (supabase as any).from("artist_contacts").update({
      first_name: editingContact.first_name,
      last_name: editingContact.last_name,
      email: editingContact.email,
      city: editingContact.city,
      phone: editingContact.phone,
      tags: editingContact.tags,
    }).eq("id", editingContact.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Contact updated");
    setEditingContact(null);
    setSelectedContact(null);
    queryClient.invalidateQueries({ queryKey: ["artist-contacts"] });
  };

  // Add tag to editing contact
  const addTagToContact = () => {
    if (!editingContact || !newTag.trim()) return;
    setEditingContact({
      ...editingContact,
      tags: Array.from(new Set([...(editingContact.tags || []), newTag.trim()])),
    });
    setNewTag("");
  };

  const removeTagFromContact = (tag: string) => {
    if (!editingContact) return;
    setEditingContact({
      ...editingContact,
      tags: (editingContact.tags || []).filter(t => t !== tag),
    });
  };

  // AI Insights
  const getAiInsights = async () => {
    if (!contacts || contacts.length === 0) { toast.error("No contacts to analyze"); return; }
    setAiLoading(true);
    setAiInsight(null);
    try {
      const summary = {
        total: contacts.length,
        cities: Object.entries(
          contacts.reduce((acc: Record<string, number>, c) => {
            const city = c.city || "Unknown";
            acc[city] = (acc[city] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1]).slice(0, 10),
        sources: Object.entries(
          contacts.reduce((acc: Record<string, number>, c) => {
            const src = c.source || "unknown";
            acc[src] = (acc[src] || 0) + 1;
            return acc;
          }, {})
        ),
        subscribed: contacts.filter(c => c.subscribed !== false).length,
        tagged: contacts.filter(c => (c.tags || []).length > 0).length,
        topTags: Object.entries(
          contacts.flatMap(c => c.tags || []).reduce((acc: Record<string, number>, t) => {
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1]).slice(0, 5),
      };

      const { data, error } = await supabase.functions.invoke("fan-ai-insights", {
        body: { summary },
      });

      if (error || !data?.insight) throw new Error(data?.error || "AI analysis failed");
      setAiInsight(data.insight);
    } catch (err: any) {
      toast.error(err.message || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = filtered.map(c => [
      c.first_name || "", c.last_name || "", c.email, c.city || "",
      c.phone || "", c.source || "", (c.tags || []).join(";"),
      c.imported_at || "",
    ]);
    const csv = ["First Name,Last Name,Email,City,Phone,Source,Tags,Date Added",
      ...rows.map(r => r.map(v => `"${v}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fan-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="list">Contact Manager</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <CSVFanImport />
        </TabsContent>

        <TabsContent value="list" className="mt-6 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Contacts", value: stats.total, icon: Users },
              { label: "Subscribed", value: stats.subscribed, icon: Mail },
              { label: "Cities", value: stats.cities, icon: Tag },
              { label: "Tagged", value: stats.tagged, icon: CheckSquare },
            ].map((s) => (
              <Card key={s.label} className="p-4 bg-card/50 border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </Card>
            ))}
          </div>

          {/* AI Insights */}
          <Card className="p-4 bg-card/50 border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">AI Fan Insights</span>
              </div>
              <Button size="sm" variant="outline" onClick={getAiInsights} disabled={aiLoading} className="gap-2">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Analyzing..." : "Analyze Fans"}
              </Button>
            </div>
            {aiInsight && (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 bg-muted/20 rounded-lg p-3 border border-border/20">
                {aiInsight}
              </div>
            )}
          </Card>

          {/* Toolbar */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, email, city..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
            </div>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="csv_import">CSV Import</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="tdz_follow">TDZ Follow</SelectItem>
              </SelectContent>
            </Select>
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><UserPlus className="w-4 h-4" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input placeholder="Email *" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="First name" value={newContact.first_name} onChange={e => setNewContact(p => ({ ...p, first_name: e.target.value }))} />
                    <Input placeholder="Last name" value={newContact.last_name} onChange={e => setNewContact(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={newContact.city} onChange={e => setNewContact(p => ({ ...p, city: e.target.value }))} />
                    <Input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <Button onClick={addContact} className="w-full">Add Contact</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-2"><Download className="w-4 h-4" /> Export</Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" variant="destructive" onClick={bulkDelete} className="gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
              <div className="flex gap-2 items-center">
                <Input placeholder="Tag name" className="h-8 w-32" value={newTag} onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newTag) { bulkTag(newTag); setNewTag(""); }}} />
                <Button size="sm" variant="outline" onClick={() => { if (newTag) { bulkTag(newTag); setNewTag(""); }}} className="gap-1">
                  <Tag className="w-3 h-3" /> Tag
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}><X className="w-4 h-4" /></Button>
            </div>
          )}

          {/* Contacts Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading contacts...
            </div>
          ) : sorted.length === 0 ? (
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
                    <th className="p-3 w-10">
                      <Checkbox checked={selectedIds.size === paged.length && paged.length > 0} onCheckedChange={toggleSelectAll} />
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("name")}>
                      <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("email")}>
                      <div className="flex items-center gap-1">Email <SortIcon field="email" /></div>
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("city")}>
                      <div className="flex items-center gap-1">City <SortIcon field="city" /></div>
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell">Tags</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("source")}>
                      <div className="flex items-center gap-1">Source <SortIcon field="source" /></div>
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground hidden xl:table-cell cursor-pointer select-none" onClick={() => toggleSort("imported_at")}>
                      <div className="flex items-center gap-1">Added <SortIcon field="imported_at" /></div>
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((contact) => (
                    <tr key={contact.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={() => toggleSelect(contact.id)} />
                      </td>
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
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {(contact.tags || []).slice(0, 2).map(t => (
                            <Badge key={t} variant="outline" className="text-[10px] py-0">{t}</Badge>
                          ))}
                          {(contact.tags || []).length > 2 && (
                            <Badge variant="outline" className="text-[10px] py-0">+{(contact.tags || []).length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {contact.source === "csv_import" ? "CSV" : contact.source || "Manual"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs hidden xl:table-cell">
                        {contact.imported_at ? format(new Date(contact.imported_at), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedContact(contact); setEditingContact(null); }}>
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
              <p className="text-sm text-muted-foreground">{sorted.length} contacts · Page {page + 1} of {totalPages}</p>
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

      {/* Contact Detail / Edit Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={() => { setSelectedContact(null); setEditingContact(null); }}>
        <SheetContent className="bg-card border-border/30 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Contact Details
              {!editingContact && selectedContact && (
                <Button variant="ghost" size="sm" onClick={() => setEditingContact({ ...selectedContact })} className="gap-1">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          {editingContact ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input value={editingContact.first_name || ""} onChange={e => setEditingContact({ ...editingContact, first_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input value={editingContact.last_name || ""} onChange={e => setEditingContact({ ...editingContact, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={editingContact.email} onChange={e => setEditingContact({ ...editingContact, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={editingContact.city || ""} onChange={e => setEditingContact({ ...editingContact, city: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={editingContact.phone || ""} onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                  {(editingContact.tags || []).map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 text-xs">
                      {t}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTagFromContact(t)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add tag" value={newTag} onChange={e => setNewTag(e.target.value)} className="h-8"
                    onKeyDown={e => { if (e.key === "Enter") addTagToContact(); }} />
                  <Button size="sm" variant="outline" onClick={addTagToContact}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={saveContact} className="flex-1 gap-2"><Save className="w-4 h-4" /> Save</Button>
                <Button variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
              </div>
            </div>
          ) : selectedContact ? (
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
              {(selectedContact.tags || []).length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {(selectedContact.tags || []).map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                <DetailRow label="City" value={selectedContact.city} />
                <DetailRow label="Phone" value={selectedContact.phone} />
                <DetailRow label="Source" value={selectedContact.source === "csv_import" ? "CSV Import" : selectedContact.source || "Manual"} />
                <DetailRow label="Status" value={selectedContact.subscribed !== false ? "Subscribed" : "Unsubscribed"} />
                <DetailRow label="Added" value={selectedContact.imported_at ? format(new Date(selectedContact.imported_at), "MMM d, yyyy h:mm a") : "—"} />
              </div>
              <Button variant="destructive" className="w-full" onClick={() => removeContact(selectedContact.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Remove Contact
              </Button>
            </div>
          ) : null}
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
