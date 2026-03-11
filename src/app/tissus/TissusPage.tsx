"use client";

import { useState, useMemo, useRef } from "react";
import type { Tissu } from "@/engine/types";
import { useTissusStore } from "@/stores/tissus-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Plus, Pencil, Trash2, Download, Upload, Search, Check, ArrowLeft } from "lucide-react";

const FOURNISSEURS = ["Tous", "Serge Ferrari", "Dickson", "Sauleda", "Autre"];
const USAGES = ["tente", "store", "bache", "pergola", "tunnel"];

// ─── Export CSV ──────────────────────────────────────────────────────────────

function exportCSV(tissus: Tissu[]) {
  const header = [
    "id", "reference", "fournisseur", "coloris", "laize_mm", "grammage_g_m2",
    "prix_ml_ht", "classification_feu", "usage", "garantie_ans", "disponible", "delai_jours",
  ].join(";");

  const rows = tissus.map((t) =>
    [
      t.id, t.reference, t.fournisseur, t.coloris, t.laize_mm, t.grammage_g_m2,
      t.prix_ml_ht, t.classification_feu, t.usage.join(","), t.garantie_ans,
      t.disponible ? "1" : "0", t.delai_jours,
    ].join(";"),
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tissus-bache-pro-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import CSV ──────────────────────────────────────────────────────────────

function parseCSV(text: string): Partial<Tissu>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const [header, ...rows] = lines;
  const cols = header!.split(";");

  return rows.map((row) => {
    const vals = row.split(";");
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => { obj[col] = vals[i] ?? ""; });
    return {
      id: String(obj["id"] || ""),
      reference: String(obj["reference"] || ""),
      fournisseur: String(obj["fournisseur"] || ""),
      coloris: String(obj["coloris"] || ""),
      laize_mm: Number(obj["laize_mm"]) || 2500,
      grammage_g_m2: Number(obj["grammage_g_m2"]) || 500,
      prix_ml_ht: Number(obj["prix_ml_ht"]) || 0,
      classification_feu: String(obj["classification_feu"] || "M2"),
      usage: String(obj["usage"] || "").split(",").filter(Boolean),
      garantie_ans: Number(obj["garantie_ans"]) || 0,
      disponible: obj["disponible"] === "1" || obj["disponible"] === "true",
      delai_jours: Number(obj["delai_jours"]) || 0,
    };
  });
}

// ─── Valeur vide pour un nouveau tissu ───────────────────────────────────────

function newTissu(): Omit<Tissu, "id"> {
  return {
    reference: "",
    fournisseur: "Serge Ferrari",
    coloris: "",
    laize_mm: 2670,
    grammage_g_m2: 520,
    prix_ml_ht: 0,
    classification_feu: "M2",
    usage: ["tente"],
    garantie_ans: 10,
    disponible: true,
    delai_jours: 7,
  };
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function TissusPage() {
  const { tissus, ajouterTissu, modifierTissu, supprimerTissu } = useTissusStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("Tous");
  const [filterDispo, setFilterDispo] = useState<"tous" | "dispo" | "indispo">("tous");

  const [editTarget, setEditTarget] = useState<Tissu | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formData, setFormData] = useState<Omit<Tissu, "id">>(newTissu());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);

  // Filtrage
  const filtered = useMemo(() => {
    return tissus.filter((t) => {
      if (filterFournisseur !== "Tous" && t.fournisseur !== filterFournisseur) return false;
      if (filterDispo === "dispo" && !t.disponible) return false;
      if (filterDispo === "indispo" && t.disponible) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.reference.toLowerCase().includes(q) ||
          t.coloris.toLowerCase().includes(q) ||
          t.fournisseur.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tissus, search, filterFournisseur, filterDispo]);

  // Ouvrir formulaire édition
  const openEdit = (t: Tissu) => {
    setIsNew(false);
    setEditTarget(t);
    const { id: _id, ...rest } = t;
    void _id;
    setFormData(rest);
  };

  const openNew = () => {
    setIsNew(true);
    setEditTarget({ id: "", ...newTissu() });
    setFormData(newTissu());
  };

  const saveForm = () => {
    if (isNew) {
      const id = `${formData.fournisseur.toLowerCase().replace(/\s+/g, "-")}-${formData.reference.toLowerCase().replace(/\s+/g, "-")}-${formData.coloris.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      ajouterTissu({ id, ...formData });
    } else if (editTarget) {
      modifierTissu(editTarget.id, formData);
    }
    setEditTarget(null);
  };

  // Import CSV
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      let added = 0;
      for (const row of rows) {
        if (!row.reference || !row.fournisseur) continue;
        const id = row.id || `import-${Date.now()}-${added}`;
        const existing = tissus.find((t) => t.id === id);
        if (existing) {
          modifierTissu(id, row as Partial<Tissu>);
        } else {
          ajouterTissu({ ...newTissu(), ...row, id } as Tissu);
        }
        added++;
      }
      setImportInfo(`${added} tissu(s) importé(s).`);
      setTimeout(() => setImportInfo(null), 4000);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const setField = <K extends keyof Omit<Tissu, "id">>(k: K, v: Omit<Tissu, "id">[K]) => {
    setFormData((p) => ({ ...p, [k]: v }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Retour à l'accueil">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold">Bibliothèque tissus</h2>
            <p className="text-sm text-muted-foreground">{tissus.length} tissu(s) — {filtered.length} affiché(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(tissus)}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" /> Import CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter
          </Button>
        </div>
      </div>

      {importInfo && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-4">
          <Check className="w-4 h-4" /> {importInfo}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <select
          value={filterFournisseur}
          onChange={(e) => setFilterFournisseur(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {FOURNISSEURS.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select
          value={filterDispo}
          onChange={(e) => setFilterDispo(e.target.value as "tous" | "dispo" | "indispo")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="tous">Tous</option>
          <option value="dispo">Disponible</option>
          <option value="indispo">Indisponible</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Aucun tissu trouvé.</div>
        )}
        {filtered.map((t) => (
          <TissuRow
            key={t.id}
            tissu={t}
            onEdit={() => openEdit(t)}
            onDelete={() => setDeleteTarget(t.id)}
          />
        ))}
      </div>

      {/* Dialog Ajouter/Modifier */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "Ajouter un tissu" : "Modifier le tissu"}</DialogTitle>
          </DialogHeader>
          <TissuForm data={formData} onChange={setField} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Annuler</Button>
            <Button onClick={saveForm} disabled={!formData.reference || !formData.coloris}>
              {isNew ? "Ajouter" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le tissu ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le tissu sera retiré de la bibliothèque
            mais les projets existants ne seront pas affectés.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => { supprimerTissu(deleteTarget!); setDeleteTarget(null); }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Ligne tissu ─────────────────────────────────────────────────────────────

function TissuRow({ tissu, onEdit, onDelete }: {
  tissu: Tissu;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all ${!tissu.disponible ? "opacity-60" : ""}`}>
      <CardContent className="p-0">
        <button
          className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded((p) => !p)}
        >
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <div className="font-medium text-sm">{tissu.reference}</div>
            <div className="text-sm text-muted-foreground">{tissu.coloris}</div>
            <Badge variant="outline" className="text-xs">{tissu.fournisseur}</Badge>
            {!tissu.disponible && (
              <Badge variant="secondary" className="text-xs text-orange-700 bg-orange-50 border-orange-200">
                Indisponible
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-sm">
            <span className="text-muted-foreground text-xs hidden sm:block">
              {tissu.laize_mm} mm · {tissu.grammage_g_m2} g/m² · {tissu.classification_feu}
            </span>
            <span className="font-semibold text-blue-700">{tissu.prix_ml_ht.toFixed(2)} €/ML</span>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-3 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <Kv label="Laize" value={`${tissu.laize_mm} mm`} />
              <Kv label="Grammage" value={`${tissu.grammage_g_m2} g/m²`} />
              <Kv label="Classif. feu" value={tissu.classification_feu} />
              <Kv label="Garantie" value={`${tissu.garantie_ans} ans`} />
              <Kv label="Délai" value={`${tissu.delai_jours} j`} />
              <Kv label="Prix" value={`${tissu.prix_ml_ht.toFixed(2)} €/ML`} />
              <Kv label="Usages" value={tissu.usage.join(", ")} />
              <Kv label="ID" value={tissu.id} mono />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kv({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <div className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

// ─── Formulaire tissu ─────────────────────────────────────────────────────────

function TissuForm({
  data,
  onChange,
}: {
  data: Omit<Tissu, "id">;
  onChange: <K extends keyof Omit<Tissu, "id">>(k: K, v: Omit<Tissu, "id">[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Référence *</Label>
          <Input value={data.reference} onChange={(e) => onChange("reference", e.target.value)} className="h-9 mt-1" placeholder="Flexilight Classic 402N" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Coloris *</Label>
          <Input value={data.coloris} onChange={(e) => onChange("coloris", e.target.value)} className="h-9 mt-1" placeholder="Champagne" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Fournisseur</Label>
          <Input value={data.fournisseur} onChange={(e) => onChange("fournisseur", e.target.value)} className="h-9 mt-1" list="fournisseurs-list" />
          <datalist id="fournisseurs-list">
            {FOURNISSEURS.filter(f => f !== "Tous").map(f => <option key={f} value={f} />)}
          </datalist>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Classification feu</Label>
          <select
            value={data.classification_feu}
            onChange={(e) => onChange("classification_feu", e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            {["M1", "M2", "M3", "B-s2,d0", "C-s2,d0"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Laize (mm)</Label>
          <Input type="number" value={data.laize_mm} onChange={(e) => onChange("laize_mm", Number(e.target.value))} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Grammage (g/m²)</Label>
          <Input type="number" value={data.grammage_g_m2} onChange={(e) => onChange("grammage_g_m2", Number(e.target.value))} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Prix €/ML HT</Label>
          <Input type="number" step="0.01" value={data.prix_ml_ht} onChange={(e) => onChange("prix_ml_ht", Number(e.target.value))} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Garantie (ans)</Label>
          <Input type="number" value={data.garantie_ans} onChange={(e) => onChange("garantie_ans", Number(e.target.value))} className="h-9 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Délai (jours)</Label>
          <Input type="number" value={data.delai_jours} onChange={(e) => onChange("delai_jours", Number(e.target.value))} className="h-9 mt-1" />
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Usages</Label>
        <div className="flex flex-wrap gap-2">
          {USAGES.map((u) => (
            <label key={u} className="flex items-center gap-1.5 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={data.usage.includes(u)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...data.usage, u]
                    : data.usage.filter((x) => x !== u);
                  onChange("usage", next);
                }}
                className="h-3.5 w-3.5"
              />
              {u}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={data.disponible}
          onChange={(e) => onChange("disponible", e.target.checked)}
          className="h-4 w-4"
        />
        Tissu disponible (en stock / commande active)
      </label>
    </div>
  );
}
