import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ParsedRow {
  [key: string]: string;
}

export function CSVFanImport() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);

  const FIELDS = ["email", "first_name", "last_name", "city"];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("File must have a header row and at least one data row"); return; }

      const hdrs = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      setHeaders(hdrs);

      const parsed = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: ParsedRow = {};
        hdrs.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });
      setRows(parsed);

      // Auto-map by name matching
      const autoMap: Record<string, string> = {};
      hdrs.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z]/g, "");
        if (lower.includes("email")) autoMap.email = h;
        else if (lower.includes("first")) autoMap.first_name = h;
        else if (lower.includes("last")) autoMap.last_name = h;
        else if (lower.includes("city") || lower.includes("location")) autoMap.city = h;
      });
      setMapping(autoMap);
    };
    reader.readAsText(f);
  }, []);

  const handleImport = async () => {
    if (!user || !mapping.email) { toast.error("Email column mapping is required"); return; }
    setImporting(true);
    let count = 0;

    const contacts = rows
      .filter(r => r[mapping.email]?.includes("@"))
      .map(r => ({
        artist_id: user.id,
        email: r[mapping.email],
        first_name: mapping.first_name ? r[mapping.first_name] || null : null,
        last_name: mapping.last_name ? r[mapping.last_name] || null : null,
        city: mapping.city ? r[mapping.city] || null : null,
        source: "csv_import",
      }));

    // Batch insert in chunks of 100
    for (let i = 0; i < contacts.length; i += 100) {
      const chunk = contacts.slice(i, i + 100);
      const { error } = await supabase.from("artist_contacts").insert(chunk as any);
      if (!error) count += chunk.length;
    }

    setImported(count);
    setImporting(false);
    toast.success(`Imported ${count} contacts`);
  };

  return (
    <Card style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Upload className="w-5 h-5" /> Import Fans from CSV
        </CardTitle>
        <CardDescription>Upload a CSV file with your fan contacts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file ? (
          <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer hover:bg-muted/20 transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <FileText className="w-10 h-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload CSV file</span>
            <input type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
          </label>
        ) : imported > 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-semibold">{imported} contacts imported</p>
            <Button variant="outline" className="mt-4" onClick={() => { setFile(null); setRows([]); setHeaders([]); setImported(0); }}>
              Import Another File
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{file.name} — {rows.length} rows found</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Map your columns:</p>
              {FIELDS.map(field => (
                <div key={field} className="flex items-center gap-4">
                  <span className="w-24 text-sm capitalize text-muted-foreground">{field.replace("_", " ")}</span>
                  <Select value={mapping[field] || ""} onValueChange={(v) => setMapping(prev => ({ ...prev, [field]: v }))}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Skip —</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {field === "email" && !mapping.email && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
              ))}
            </div>
            <Button onClick={handleImport} disabled={importing || !mapping.email} className="gap-2">
              {importing ? "Importing..." : `Import ${rows.length} Contacts`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
