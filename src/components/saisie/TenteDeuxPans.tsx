"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { TenteDeuxPansParams, OptionsPatronage } from "@/engine/types";
import { genererPanneaux } from "@/engine/typologies/tente-deux-pans";
import { useProjetStore } from "@/stores/projet-store";
import { useTissusStore } from "@/stores/tissus-store";
import { useParametresStore } from "@/stores/parametres-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LambrequinField, OeilletConfigField } from "./OptionsCommunes";
import { arrondirML } from "@/lib/constants";
import { Ruler, Layers, BarChart3, Euro, Settings2, Circle } from "lucide-react";

interface Props {
  projetId: string;
}

function DimensionField({
  label,
  value,
  onChange,
  suffix = "mm",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 pr-10 text-sm font-medium"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function TenteDeuxPans({ projetId }: Props) {
  const { projets, updateParams, updateTissu, updateResultat, updateProjet } = useProjetStore();
  const { tissus } = useTissusStore();
  const { ourlet_mm, recouvrement_mm, marge_coupe_mm, setParametre } = useParametresStore();

  const projet = projets.find((p) => p.id === projetId);
  const params = projet?.params as TenteDeuxPansParams | undefined;
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);

  const resultat = useMemo(() => {
    if (!params || !tissu) return null;
    const options: OptionsPatronage = { laize_mm: tissu.laize_mm, ourlet_mm, recouvrement_mm, marge_coupe_mm };
    try {
      return genererPanneaux(params, options);
    } catch {
      return null;
    }
  }, [params, tissu, ourlet_mm, recouvrement_mm]);

  useEffect(() => {
    if (resultat && projetId) {
      updateResultat(projetId, resultat);
    }
  }, [resultat, projetId, updateResultat]);

  const setParam = useCallback(
    <K extends keyof TenteDeuxPansParams>(key: K, value: TenteDeuxPansParams[K]) => {
      if (!params) return;
      updateParams(projetId, { ...params, [key]: value });
    },
    [params, projetId, updateParams],
  );

  if (!projet || !params) return null;

  return (
    <div className="p-4 md:p-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Formulaire */}
      <div className="space-y-5">
        {/* Infos projet */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nom du projet</Label>
              <Input
                value={projet.nom}
                onChange={(e) => updateProjet(projetId, { nom: e.target.value })}
                className="h-10 font-medium"
                placeholder="Ex: LDC 32"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Client</Label>
              <Input
                value={projet.client}
                onChange={(e) => updateProjet(projetId, { client: e.target.value })}
                className="h-10"
                placeholder="Ex: Camping du Lac"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <DimensionField label="Largeur base" value={params.largeur_base_mm} onChange={(v) => setParam("largeur_base_mm", v)} />
              <DimensionField label="Profondeur (longueur faitAge)" value={params.profondeur_mm} onChange={(v) => setParam("profondeur_mm", v)} />
              <DimensionField label="Rampant gauche" value={params.rampant_gauche_mm} onChange={(v) => setParam("rampant_gauche_mm", v)} />
              <DimensionField label="Rampant droit" value={params.rampant_droit_mm} onChange={(v) => setParam("rampant_droit_mm", v)} />
              <DimensionField label="Hauteur murs lateraux" value={params.hauteur_murs_mm} onChange={(v) => setParam("hauteur_murs_mm", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Pignons + Lambrequins */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pignons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={params.pignon_avant}
                  onChange={(e) => setParam("pignon_avant", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Pignon avant</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={params.pignon_arriere}
                  onChange={(e) => setParam("pignon_arriere", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Pignon arriere</span>
              </label>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Lambrequins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LambrequinField
                label="Gauche"
                value={params.lambrequin_gauche}
                onChange={(v) => setParam("lambrequin_gauche", v)}
                pignonContext={{
                  largeur_base_mm: params.largeur_base_mm,
                  rampant_mm: Math.max(params.rampant_gauche_mm, params.rampant_droit_mm),
                  hauteur_murs_mm: params.hauteur_murs_mm,
                }}
              />
              <LambrequinField
                label="Droit"
                value={params.lambrequin_droit}
                onChange={(v) => setParam("lambrequin_droit", v)}
                pignonContext={{
                  largeur_base_mm: params.largeur_base_mm,
                  rampant_mm: Math.max(params.rampant_gauche_mm, params.rampant_droit_mm),
                  hauteur_murs_mm: params.hauteur_murs_mm,
                }}
              />
            </CardContent>
          </Card>
        </div>

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
              value={params.oeillets_config}
              onChange={(v) => setParam("oeillets_config", v)}
              nbOeillets={resultat?.nb_oeillets}
            />
          </CardContent>
        </Card>

        {/* Tissu */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Tissu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={projet.tissu_id}
              onChange={(e) => updateTissu(projetId, e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {tissus.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.reference} — {t.coloris} ({t.fournisseur})
                </option>
              ))}
            </select>
            {tissu && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">Laize {tissu.laize_mm}mm</Badge>
                <Badge variant="secondary" className="text-xs">{tissu.grammage_g_m2} g/m²</Badge>
                <Badge variant="secondary" className="text-xs">{tissu.classification_feu}</Badge>
                <Badge variant="secondary" className="text-xs">{tissu.prix_ml_ht} €/ML</Badge>
                {tissu.garantie_ans > 0 && (
                  <Badge variant="secondary" className="text-xs">Garantie {tissu.garantie_ans} ans</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options confection */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Options confection
              <span className="text-xs font-normal text-muted-foreground ml-auto">Paramètres globaux</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ourlet (mm)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={ourlet_mm}
                    onChange={(e) => setParametre("ourlet_mm", Number(e.target.value))}
                    className="h-9 pr-8 text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ourlet par bout de bande</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Recouvrement (mm)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={recouvrement_mm}
                    onChange={(e) => setParametre("recouvrement_mm", Number(e.target.value))}
                    className="h-9 pr-8 text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Chevauchement soudure</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Marge coupe (mm)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={marge_coupe_mm}
                    onChange={(e) => setParametre("marge_coupe_mm", Number(e.target.value))}
                    className="h-9 pr-8 text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Marge de sécurité par bout</p>
              </div>
            </div>
            {tissu && params.profondeur_mm > 0 && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Longueur bande versant = {(params.profondeur_mm / 1000).toFixed(2)}m profondeur
                {" + "}{(2 * ourlet_mm / 1000).toFixed(2)}m ourlets
                {" + "}{(2 * marge_coupe_mm / 1000).toFixed(2)}m marges coupe
                {" = "}<strong>{((params.profondeur_mm + 2 * ourlet_mm + 2 * marge_coupe_mm) / 1000).toFixed(2)}m</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panneau resultats sticky */}
      <div className="lg:sticky lg:top-[65px] lg:self-start space-y-4">
        <Card className="shadow-md border-primary/10 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-5 py-4">
            <p className="text-xs font-medium text-primary/70 uppercase tracking-wider">Resultat patronage</p>
            {resultat ? (
              <div className="text-4xl font-bold text-primary mt-1 tracking-tight">
                {resultat.ml_total} <span className="text-lg font-medium">ML</span>
              </div>
            ) : (
              <div className="text-lg text-muted-foreground mt-1">—</div>
            )}
          </div>

          {resultat && (
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Laizes</p>
                    <p className="font-semibold text-sm">{resultat.nombre_laizes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Surface</p>
                    <p className="font-semibold text-sm">{resultat.surface_totale_m2} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Chute</p>
                    <p className="font-semibold text-sm">{resultat.taux_chute_pct}%</p>
                  </div>
                </div>
                {tissu && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tissu HT</p>
                      <p className="font-semibold text-sm">
                        {(resultat.ml_total * tissu.prix_ml_ht).toFixed(0)} €
                      </p>
                    </div>
                  </div>
                )}
                {resultat.nb_oeillets !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Œillets</p>
                      <p className="font-semibold text-sm">{resultat.nb_oeillets}</p>
                    </div>
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

              {resultat.lambrequins && resultat.lambrequins.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lambrequins</p>
                    {resultat.lambrequins.map((lam) => (
                      <div key={lam.id} className="flex items-center justify-between text-sm py-0.5">
                        <span className="text-muted-foreground">{lam.nom}</span>
                        {lam.pris_en_chute ? (
                          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                            Chute — 0 ML
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                            +{lam.ml_dedie} ML
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          )}

          {!resultat && (
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Renseignez les dimensions et le tissu pour voir le resultat.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
