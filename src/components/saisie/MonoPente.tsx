"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { MonoPenteParams, OeilletConfig, OptionsPatronage } from "@/engine/types";
import { genererPanneaux } from "@/engine/typologies/mono-pente";
import { useProjetStore } from "@/stores/projet-store";
import { useTissusStore } from "@/stores/tissus-store";
import { useParametresStore } from "@/stores/parametres-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OeilletConfigField } from "./OptionsCommunes";
import { arrondirML } from "@/lib/constants";
import { Ruler, Layers, BarChart3, Euro, Circle } from "lucide-react";

interface Props {
  projetId: string;
}

function DimensionField({ label, value, onChange, suffix = "mm" }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <div className="relative">
        <Input type="number" inputMode="numeric" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="h-10 pr-10 text-sm font-medium" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

export default function MonoPente({ projetId }: Props) {
  const { projets, updateParams, updateTissu, updateResultat, updateProjet } = useProjetStore();
  const { tissus } = useTissusStore();
  const { ourlet_mm, recouvrement_mm } = useParametresStore();

  const projet = projets.find((p) => p.id === projetId);
  const params = projet?.params as MonoPenteParams | undefined;
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);

  const resultat = useMemo(() => {
    if (!params || !tissu) return null;
    const options: OptionsPatronage = { laize_mm: tissu.laize_mm, ourlet_mm, recouvrement_mm };
    try { return genererPanneaux(params, options); } catch { return null; }
  }, [params, tissu, ourlet_mm, recouvrement_mm]);

  useEffect(() => {
    if (resultat && projetId) updateResultat(projetId, resultat);
  }, [resultat, projetId, updateResultat]);

  const setParam = useCallback(
    <K extends keyof MonoPenteParams>(key: K, value: MonoPenteParams[K]) => {
      if (!params) return;
      updateParams(projetId, { ...params, [key]: value });
    },
    [params, projetId, updateParams],
  );

  if (!projet || !params) return null;

  return (
    <div className="p-4 md:p-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card className="shadow-sm">
          <CardContent className="pt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nom du projet</Label>
              <Input value={projet.nom} onChange={(e) => updateProjet(projetId, { nom: e.target.value })} className="h-10 font-medium" placeholder="Ex: Auvent terrasse" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Client</Label>
              <Input value={projet.client} onChange={(e) => updateProjet(projetId, { client: e.target.value })} className="h-10" placeholder="Ex: Restaurant du Port" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <DimensionField label="Largeur" value={params.largeur_mm} onChange={(v) => setParam("largeur_mm", v)} />
              <DimensionField label="Profondeur" value={params.profondeur_mm} onChange={(v) => setParam("profondeur_mm", v)} />
              <DimensionField label="Rampant (longueur pente)" value={params.rampant_mm} onChange={(v) => setParam("rampant_mm", v)} />
              <DimensionField label="Hauteur cote haut" value={params.hauteur_haute_mm} onChange={(v) => setParam("hauteur_haute_mm", v)} />
              <DimensionField label="Hauteur cote bas" value={params.hauteur_basse_mm} onChange={(v) => setParam("hauteur_basse_mm", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Œillets */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Circle className="w-4 h-4 text-primary" />
              Œillets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OeilletConfigField
              value={(params as { oeillets_config?: OeilletConfig }).oeillets_config}
              onChange={(v) => updateParams(projetId, { ...params, oeillets_config: v })}
              nbOeillets={resultat?.nb_oeillets}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Tissu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select value={projet.tissu_id} onChange={(e) => updateTissu(projetId, e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {tissus.map((t) => (<option key={t.id} value={t.id}>{t.reference} — {t.coloris} ({t.fournisseur})</option>))}
            </select>
            {tissu && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">Laize {tissu.laize_mm}mm</Badge>
                <Badge variant="secondary" className="text-xs">{tissu.grammage_g_m2} g/m²</Badge>
                <Badge variant="secondary" className="text-xs">{tissu.prix_ml_ht} €/ML</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-[65px] lg:self-start space-y-4">
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-5 py-4">
            <p className="text-xs font-medium text-primary/70 uppercase tracking-wider">Resultat patronage</p>
            {resultat ? (
              <div className="text-4xl font-bold text-primary mt-1 tracking-tight">
                {resultat.ml_total} <span className="text-lg font-medium">ML</span>
              </div>
            ) : (<div className="text-lg text-muted-foreground mt-1">—</div>)}
          </div>
          {resultat && (
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><Layers className="w-4 h-4 text-muted-foreground" /></div>
                  <div><p className="text-xs text-muted-foreground">Laizes</p><p className="font-semibold text-sm">{resultat.nombre_laizes}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><BarChart3 className="w-4 h-4 text-muted-foreground" /></div>
                  <div><p className="text-xs text-muted-foreground">Surface</p><p className="font-semibold text-sm">{resultat.surface_totale_m2} m²</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><BarChart3 className="w-4 h-4 text-muted-foreground" /></div>
                  <div><p className="text-xs text-muted-foreground">Chute</p><p className="font-semibold text-sm">{resultat.taux_chute_pct}%</p></div>
                </div>
                {tissu && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><Euro className="w-4 h-4 text-muted-foreground" /></div>
                    <div><p className="text-xs text-muted-foreground">Tissu HT</p><p className="font-semibold text-sm">{(resultat.ml_total * tissu.prix_ml_ht).toFixed(0)} €</p></div>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detail panneaux</p>
                {resultat.panneaux.map((p) => {
                  const ml = p.bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">{p.nom}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{p.bandes.length} laize{p.bandes.length > 1 ? "s" : ""}</span>
                        <span className="font-semibold w-16 text-right">{Math.round(ml * 100) / 100} ML</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
          {!resultat && (
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Renseignez les dimensions et le tissu pour voir le resultat.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
