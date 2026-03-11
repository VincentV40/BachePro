"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParametresStore } from "@/stores/parametres-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const store = useParametresStore();
  const { setParametre, setEntreprise, entreprise } = store;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Retour à l'accueil"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold">Paramètres</h2>
          <p className="text-sm text-muted-foreground">
            Valeurs par défaut — persistées localement.
          </p>
        </div>
      </div>

      {/* ─── Confection ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Confection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldNum
            label="Ourlet / bout de bande (mm)"
            value={store.ourlet_mm}
            onChange={(v) => setParametre("ourlet_mm", v)}
          />
          <FieldNum
            label="Recouvrement soudure (mm)"
            value={store.recouvrement_mm}
            onChange={(v) => setParametre("recouvrement_mm", v)}
          />
          <FieldNum
            label="Marge de coupe / extrémité (mm)"
            value={store.marge_coupe_mm}
            onChange={(v) => setParametre("marge_coupe_mm", v)}
          />
        </CardContent>
      </Card>

      {/* ─── Taux horaires ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Taux horaires & pose</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldNum
            label="Confection (€/h)"
            value={store.taux_horaire_confection}
            step={0.5}
            onChange={(v) => setParametre("taux_horaire_confection", v)}
          />
          <FieldNum
            label="Pose (€/h)"
            value={store.taux_horaire_pose}
            step={0.5}
            onChange={(v) => setParametre("taux_horaire_pose", v)}
          />
          <FieldNum
            label="Nb poseurs par défaut"
            value={store.nb_poseurs_defaut}
            min={1}
            onChange={(v) => setParametre("nb_poseurs_defaut", v)}
          />
          <FieldNum
            label="Coût km déplacement (€/km)"
            value={store.cout_km}
            step={0.01}
            onChange={(v) => setParametre("cout_km", v)}
          />
        </CardContent>
      </Card>

      {/* ─── Finances ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Finances</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldNum
            label="Frais généraux / overhead (%)"
            value={store.overhead_pct}
            step={0.5}
            onChange={(v) => setParametre("overhead_pct", v)}
          />
          <FieldNum
            label="Marge commerciale par défaut (%)"
            value={store.marge_defaut_pct}
            step={0.5}
            onChange={(v) => setParametre("marge_defaut_pct", v)}
          />
          <div>
            <Label className="text-xs text-muted-foreground">TVA par défaut</Label>
            <select
              value={store.tva_taux}
              onChange={(e) => setParametre("tva_taux", Number(e.target.value))}
              className="w-full h-9 mt-1 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={20}>20 %</option>
              <option value={10}>10 %</option>
              <option value={5.5}>5,5 %</option>
              <option value={0}>0 % (exonéré)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ─── Entreprise ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Coordonnées entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldText
                label="Raison sociale"
                value={entreprise.nom}
                onChange={(v) => setEntreprise({ nom: v })}
              />
            </div>
            <div className="col-span-2">
              <FieldText
                label="Adresse"
                value={entreprise.adresse}
                onChange={(v) => setEntreprise({ adresse: v })}
              />
            </div>
            <FieldText
              label="Code postal"
              value={entreprise.code_postal}
              onChange={(v) => setEntreprise({ code_postal: v })}
            />
            <FieldText
              label="Ville"
              value={entreprise.ville}
              onChange={(v) => setEntreprise({ ville: v })}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <FieldText
              label="SIRET"
              value={entreprise.siret}
              onChange={(v) => setEntreprise({ siret: v })}
              placeholder="000 000 000 00000"
            />
            <FieldText
              label="Téléphone"
              value={entreprise.tel}
              onChange={(v) => setEntreprise({ tel: v })}
              placeholder="05 XX XX XX XX"
            />
            <FieldText
              label="Email"
              value={entreprise.email}
              onChange={(v) => setEntreprise({ email: v })}
              placeholder="contact@..."
            />
            <FieldText
              label="Site web"
              value={entreprise.site}
              onChange={(v) => setEntreprise({ site: v })}
              placeholder="www...."
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Sauvegarde automatique dans le navigateur (localStorage).
      </p>
    </div>
  );
}

// ─── Composants internes ─────────────────────────────────────────────────────

function FieldNum({
  label,
  value,
  step = 1,
  min,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className="h-9 mt-1"
      />
    </div>
  );
}

function FieldText({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 mt-1"
      />
    </div>
  );
}
