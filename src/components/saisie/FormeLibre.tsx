"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormeLibreParams, OeilletConfig, OptionsPatronage, Point2D } from "@/engine/types";
import { genererPanneaux } from "@/engine/typologies/forme-libre";
import { useProjetStore } from "@/stores/projet-store";
import { useTissusStore } from "@/stores/tissus-store";
import { useParametresStore } from "@/stores/parametres-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OeilletConfigField } from "./OptionsCommunes";
import { arrondirML } from "@/lib/constants";
import { Ruler, Layers, BarChart3, Euro, Plus, Trash2, Circle } from "lucide-react";

interface Props { projetId: string; }

export default function FormeLibre({ projetId }: Props) {
  const { projets, updateParams, updateTissu, updateResultat, updateProjet } = useProjetStore();
  const { tissus } = useTissusStore();
  const { ourlet_mm, recouvrement_mm } = useParametresStore();

  const projet = projets.find((p) => p.id === projetId);
  const params = projet?.params as FormeLibreParams | undefined;
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);

  const resultat = useMemo(() => {
    if (!params || !tissu || params.vertices.length < 3) return null;
    const options: OptionsPatronage = { laize_mm: tissu.laize_mm, ourlet_mm, recouvrement_mm };
    try { return genererPanneaux(params, options); } catch { return null; }
  }, [params, tissu, ourlet_mm, recouvrement_mm]);

  useEffect(() => {
    if (resultat && projetId) updateResultat(projetId, resultat);
  }, [resultat, projetId, updateResultat]);

  const updateVertex = useCallback((index: number, coord: 0 | 1, value: number) => {
    if (!params) return;
    const newVertices = params.vertices.map((v, i) =>
      i === index ? (coord === 0 ? [value, v[1]] : [v[0], value]) as Point2D : v
    );
    updateParams(projetId, { ...params, vertices: newVertices });
  }, [params, projetId, updateParams]);

  const addVertex = useCallback(() => {
    if (!params) return;
    const lastPt: Point2D = (params.vertices.length > 0 ? params.vertices[params.vertices.length - 1] : undefined) ?? [0, 0];
    updateParams(projetId, { ...params, vertices: [...params.vertices, [lastPt[0] + 500, lastPt[1]] as Point2D] });
  }, [params, projetId, updateParams]);

  const removeVertex = useCallback((index: number) => {
    if (!params) return;
    updateParams(projetId, { ...params, vertices: params.vertices.filter((_, i) => i !== index) });
  }, [params, projetId, updateParams]);

  if (!projet || !params) return null;

  // SVG preview
  const svgSize = 250;
  const verts = params.vertices;
  let svgPath = "";
  if (verts.length >= 3) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of verts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.min((svgSize - 40) / w, (svgSize - 40) / h);
    const ox = 20 + ((svgSize - 40) - w * scale) / 2;
    const oy = 20 + ((svgSize - 40) - h * scale) / 2;
    svgPath = verts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${ox + (x - minX) * scale},${oy + (y - minY) * scale}`).join(" ") + " Z";
  }

  return (
    <div className="p-4 md:p-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card className="shadow-sm">
          <CardContent className="pt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nom du projet</Label>
              <Input value={projet.nom} onChange={(e) => updateProjet(projetId, { nom: e.target.value })} className="h-10 font-medium" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Client</Label>
              <Input value={projet.client} onChange={(e) => updateProjet(projetId, { client: e.target.value })} className="h-10" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Ruler className="w-4 h-4 text-primary" /> Sommets du polygone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {params.vertices.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input type="number" inputMode="numeric" value={v[0] || ""} onChange={(e) => updateVertex(i, 0, Number(e.target.value))} className="h-9 pr-8 text-sm" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">X</span>
                  </div>
                  <div className="relative">
                    <Input type="number" inputMode="numeric" value={v[1] || ""} onChange={(e) => updateVertex(i, 1, Number(e.target.value))} className="h-9 pr-8 text-sm" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Y</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeVertex(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1" onClick={addVertex}>
              <Plus className="w-3.5 h-3.5" /> Ajouter un sommet
            </Button>

            {svgPath && (
              <div className="mt-4 flex justify-center">
                <svg width={svgSize} height={svgSize} className="border rounded-md bg-muted/30">
                  <path d={svgPath} fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth={2} />
                </svg>
              </div>
            )}
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
            <CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Tissu</CardTitle>
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
              <div className="text-4xl font-bold text-primary mt-1 tracking-tight">{resultat.ml_total} <span className="text-lg font-medium">ML</span></div>
            ) : (<div className="text-lg text-muted-foreground mt-1">—</div>)}
          </div>
          {resultat && (
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><Layers className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Laizes</p><p className="font-semibold text-sm">{resultat.nombre_laizes}</p></div></div>
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><BarChart3 className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Surface</p><p className="font-semibold text-sm">{resultat.surface_totale_m2} m²</p></div></div>
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><BarChart3 className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Chute</p><p className="font-semibold text-sm">{resultat.taux_chute_pct}%</p></div></div>
                {tissu && (<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"><Euro className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Tissu HT</p><p className="font-semibold text-sm">{(resultat.ml_total * tissu.prix_ml_ht).toFixed(0)} €</p></div></div>)}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detail panneaux</p>
                {resultat.panneaux.map((p) => {
                  const ml = p.bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0);
                  return (<div key={p.id} className="flex items-center justify-between text-sm py-1"><span className="text-muted-foreground">{p.nom}</span><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{p.bandes.length} laize{p.bandes.length > 1 ? "s" : ""}</span><span className="font-semibold w-16 text-right">{Math.round(ml * 100) / 100} ML</span></div></div>);
                })}
              </div>
            </CardContent>
          )}
          {!resultat && (<CardContent className="pt-4"><p className="text-sm text-muted-foreground">Definissez au moins 3 sommets et un tissu pour voir le resultat.</p></CardContent>)}
        </Card>
      </div>
    </div>
  );
}
