"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ResultatPatronage, Tissu, Chiffrage, OeilletConfig } from "@/engine/types";
import { calculerChiffrage } from "@/engine/chiffrage/cout-revient";
import { useParametresStore } from "@/stores/parametres-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Fourniture {
  id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
}

interface Remises {
  fourniture_pct: number;   // Tissu + fournitures
  confection_pct: number;   // MO confection
  pose_pct: number;         // MO pose
  deplacement_pct: number;  // Déplacement + sous-traitance
}

interface Overrides {
  heures_confection?: number;   // undefined = auto-estimé
  heures_pose?: number;         // undefined = auto-estimé
  km_deplacement: number;
  sous_traitance: number;
  marge_pct: number;
  tva_taux: number;
}

/** Prix indicatif des œillets inox par diamètre */
const PRIX_OEILLET: Record<number, number> = { 12: 0.35, 16: 0.45, 20: 0.55 };

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  oeillets_config?: OeilletConfig;
  onChiffrageChange?: (chiffrage: Chiffrage) => void;
}

/** Distribue l'overhead proportionnellement sur un poste */
function allocOverhead(coutPoste: number, coutDirect: number, overhead: number): number {
  return coutDirect > 0 ? overhead * coutPoste / coutDirect : 0;
}

export default function CoutDeRevient({ resultat, tissu, oeillets_config, onChiffrageChange }: Props) {
  const params = useParametresStore();

  const [overrides, setOverrides] = useState<Overrides>({
    km_deplacement: 0,
    sous_traitance: 0,
    marge_pct: params.marge_defaut_pct,
    tva_taux: params.tva_taux,
  });
  const [fournitures, setFournitures] = useState<Fourniture[]>([]);
  const [remises, setRemises] = useState<Remises>({
    fourniture_pct: 0,
    confection_pct: 0,
    pose_pct: 0,
    deplacement_pct: 0,
  });
  const [showRemises, setShowRemises] = useState(false);

  // Fourniture auto œillets (si activés et nb_oeillets calculé)
  const oeilletsFourniture = useMemo(() => {
    const nb = resultat.nb_oeillets;
    if (!oeillets_config?.actif || !nb || nb === 0) return null;
    const diam = oeillets_config.diametre_mm ?? 16;
    const prix = PRIX_OEILLET[diam] ?? 0.45;
    return { description: `Œillets inox Ø${diam}mm`, quantite: nb, prix_unitaire: prix };
  }, [resultat.nb_oeillets, oeillets_config]);

  // Chiffrage de base (sans remises)
  const chiffrage = useMemo(() => {
    const fournList = fournitures.map(({ description, quantite, prix_unitaire }) => ({
      description, quantite, prix_unitaire,
    }));
    if (oeilletsFourniture) fournList.unshift(oeilletsFourniture);
    return calculerChiffrage(resultat, tissu, {
      heures_confection: overrides.heures_confection,
      heures_pose: overrides.heures_pose,
      km_deplacement: overrides.km_deplacement,
      sous_traitance: overrides.sous_traitance,
      marge_pct: overrides.marge_pct,
      taux_horaire_confection: params.taux_horaire_confection,
      taux_horaire_pose: params.taux_horaire_pose,
      nb_poseurs: params.nb_poseurs_defaut,
      cout_km: params.cout_km,
      overhead_pct: params.overhead_pct,
      tva_taux: overrides.tva_taux,
      fournitures: fournList,
    });
  }, [resultat, tissu, overrides, fournitures, oeilletsFourniture, params]);

  // Prix de vente final avec remises par poste
  const { prixVenteHt, remiseMontant } = useMemo(() => {
    const marge = overrides.marge_pct;

    const hasAnyRemise = Object.values(remises).some((v) => v > 0);
    if (!hasAnyRemise) return { prixVenteHt: chiffrage.prix_vente_ht, remiseMontant: 0 };

    // Coefficient multiplicateur : PV = CR × (1 + marge%)
    const coef = 1 + marge / 100;

    const coutFourniture = chiffrage.matiere.total
      + chiffrage.fournitures.reduce((s, f) => s + f.total, 0);
    const coutConfection = chiffrage.mo_confection.total;
    const coutPose = chiffrage.mo_pose.total;
    const coutDepl = chiffrage.deplacement.total + chiffrage.sous_traitance;

    const coutDirect = coutFourniture + coutConfection + coutPose + coutDepl;
    const overhead = chiffrage.overhead_montant;

    const pvF = (coutFourniture + allocOverhead(coutFourniture, coutDirect, overhead)) * coef * (1 - remises.fourniture_pct / 100);
    const pvC = (coutConfection + allocOverhead(coutConfection, coutDirect, overhead)) * coef * (1 - remises.confection_pct / 100);
    const pvP = (coutPose + allocOverhead(coutPose, coutDirect, overhead)) * coef * (1 - remises.pose_pct / 100);
    const pvD = (coutDepl + allocOverhead(coutDepl, coutDirect, overhead)) * coef * (1 - remises.deplacement_pct / 100);

    const ht = Math.round((pvF + pvC + pvP + pvD) * 100) / 100;
    const remise = Math.round((chiffrage.prix_vente_ht - ht) * 100) / 100;
    return { prixVenteHt: ht, remiseMontant: Math.max(0, remise) };
  }, [chiffrage, overrides.marge_pct, remises]);

  const prixVenteTtc = Math.round(prixVenteHt * (1 + overrides.tva_taux / 100) * 100) / 100;

  // Chiffrage enrichi avec remises pour les exports
  const chiffrageAvecRemises = useMemo<Chiffrage>(() => ({
    ...chiffrage,
    prix_vente_ht: prixVenteHt,
    prix_vente_ttc: prixVenteTtc,
    remise_commerciale_ht: remiseMontant,
    remises_pct: remiseMontant > 0 ? { ...remises } : undefined,
  }), [chiffrage, prixVenteHt, prixVenteTtc, remiseMontant, remises]);

  useEffect(() => {
    onChiffrageChange?.(chiffrageAvecRemises);
  }, [chiffrageAvecRemises, onChiffrageChange]);

  const set = useCallback(<K extends keyof Overrides>(key: K, value: Overrides[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetOverride = useCallback((key: "heures_confection" | "heures_pose") => {
    setOverrides((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const setRemise = useCallback((key: keyof Remises, value: number) => {
    setRemises((prev) => ({ ...prev, [key]: Math.min(100, Math.max(0, value)) }));
  }, []);

  // Fournitures
  const addFourniture = () => {
    setFournitures((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantite: 1, prix_unitaire: 0 },
    ]);
  };
  const updateFourniture = (id: string, field: keyof Omit<Fourniture, "id">, value: string | number) => {
    setFournitures((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };
  const removeFourniture = (id: string) => {
    setFournitures((prev) => prev.filter((f) => f.id !== id));
  };

  const hasRemise = remiseMontant > 0;
  const totalRemises = remises.fourniture_pct + remises.confection_pct + remises.pose_pct + remises.deplacement_pct;

  // Couleur marge
  const margeColor =
    overrides.marge_pct < 20
      ? "text-red-600"
      : overrides.marge_pct <= 35
        ? "text-green-600"
        : "text-blue-700";

  return (
    <div className="space-y-4">

      {/* ─── Tableau des postes ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Détail des postes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Poste</th>
                <th className="text-right px-3 py-2 font-medium">Qté</th>
                <th className="text-right px-3 py-2 font-medium">Prix unit.</th>
                <th className="text-right px-4 py-2 font-medium">Total HT</th>
                <th className="w-6 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">

              {/* Tissu */}
              <tr>
                <td className="px-4 py-2.5 font-medium">{tissu.reference}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">
                  {chiffrage.matiere.tissu_ml} ML
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">
                  {chiffrage.matiere.prix_ml} €/ML
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">
                  {chiffrage.matiere.total.toFixed(2)} €
                </td>
                <td />
              </tr>

              {/* Confection — heures modifiables, taux fixé dans Paramètres */}
              <tr className={overrides.heures_confection !== undefined ? "bg-yellow-50" : ""}>
                <td className="px-4 py-2.5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Confection</span>
                    <span className="text-xs text-muted-foreground">{chiffrage.mo_confection.taux} €/h</span>
                    {overrides.heures_confection !== undefined && (
                      <button onClick={() => resetOverride("heures_confection")} title="Rétablir l'estimation auto" className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="0.5"
                      value={overrides.heures_confection ?? chiffrage.mo_confection.heures}
                      onChange={(e) => set("heures_confection", e.target.value ? Number(e.target.value) : undefined)}
                      className={`h-7 w-20 text-sm text-right ${overrides.heures_confection === undefined ? "text-muted-foreground italic" : "font-medium"}`}
                    />
                    <span className="text-muted-foreground text-xs">h</span>
                  </div>
                </td>
                <td className="px-3 py-2.5" />
                <td className="px-4 py-2.5 text-right font-semibold">
                  {chiffrage.mo_confection.total.toFixed(2)} €
                </td>
                <td />
              </tr>

              {/* Pose — heures modifiables, taux fixé dans Paramètres */}
              <tr className={overrides.heures_pose !== undefined ? "bg-yellow-50" : ""}>
                <td className="px-4 py-2.5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Pose</span>
                    <span className="text-xs text-muted-foreground">
                      {chiffrage.mo_pose.nb_poseurs} pos. × {chiffrage.mo_pose.taux} €/h
                    </span>
                    {overrides.heures_pose !== undefined && (
                      <button onClick={() => resetOverride("heures_pose")} title="Rétablir l'estimation auto" className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="0.5"
                      value={overrides.heures_pose ?? chiffrage.mo_pose.heures}
                      onChange={(e) => set("heures_pose", e.target.value ? Number(e.target.value) : undefined)}
                      className={`h-7 w-20 text-sm text-right ${overrides.heures_pose === undefined ? "text-muted-foreground italic" : "font-medium"}`}
                    />
                    <span className="text-muted-foreground text-xs">h</span>
                  </div>
                </td>
                <td className="px-3 py-2.5" />
                <td className="px-4 py-2.5 text-right font-semibold">
                  {chiffrage.mo_pose.total.toFixed(2)} €
                </td>
                <td />
              </tr>

              {/* Déplacement */}
              <tr>
                <td className="px-4 py-2.5 font-medium">Déplacement</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={overrides.km_deplacement || ""}
                      onChange={(e) => set("km_deplacement", Number(e.target.value))}
                      className="h-7 w-20 text-sm text-right"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground text-xs">km</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground text-xs">
                  {chiffrage.deplacement.cout_km} €/km
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">
                  {chiffrage.deplacement.total.toFixed(2)} €
                </td>
                <td />
              </tr>

              {/* Sous-traitance */}
              <tr>
                <td className="px-4 py-2.5 font-medium">Sous-traitance</td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5" />
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={overrides.sous_traitance || ""}
                      onChange={(e) => set("sous_traitance", Number(e.target.value))}
                      className="h-7 w-28 text-sm text-right"
                      placeholder="0.00"
                    />
                    <span className="text-muted-foreground text-xs">€</span>
                  </div>
                </td>
                <td />
              </tr>

              {/* Fournitures manuelles */}
              {fournitures.map((f) => {
                const total = Math.round(f.quantite * f.prix_unitaire * 100) / 100;
                return (
                  <tr key={f.id} className="bg-orange-50/40">
                    <td className="px-4 py-1.5">
                      <Input
                        value={f.description}
                        onChange={(e) => updateFourniture(f.id, "description", e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={f.quantite || ""}
                          onChange={(e) => updateFourniture(f.id, "quantite", Number(e.target.value))}
                          className="h-7 w-16 text-sm text-right"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={f.prix_unitaire || ""}
                          onChange={(e) => updateFourniture(f.id, "prix_unitaire", Number(e.target.value))}
                          className="h-7 w-20 text-sm text-right"
                          placeholder="0.00"
                        />
                        <span className="text-muted-foreground text-xs">€</span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-right font-semibold text-sm">
                      {total.toFixed(2)} €
                    </td>
                    <td className="pr-2 py-1.5 text-right">
                      <button
                        onClick={() => removeFourniture(f.id)}
                        className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Overhead */}
              <tr className="bg-muted/20">
                <td className="px-4 py-2.5 text-muted-foreground italic">
                  Frais généraux ({chiffrage.overhead_pct}%)
                </td>
                <td colSpan={2} />
                <td className="px-4 py-2.5 text-right text-muted-foreground">
                  {chiffrage.overhead_montant.toFixed(2)} €
                </td>
                <td />
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/10">
                <td className="px-4 py-2.5 font-bold" colSpan={3}>
                  Coût de revient HT
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-base">
                  {chiffrage.cout_revient_ht.toFixed(2)} €
                </td>
                <td />
              </tr>
            </tfoot>
          </table>

          {/* Bouton ajouter fourniture */}
          <div className="px-4 py-2 border-t">
            <button
              onClick={addFourniture}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une fourniture
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Remises commerciales ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowRemises((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <CardTitle className="text-sm">Remises commerciales</CardTitle>
              {totalRemises > 0 && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                  Actives
                </Badge>
              )}
            </div>
            {showRemises ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {showRemises && (
          <CardContent className="pt-0 space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              La remise s'applique après marge : PV poste = Coût revient × (1 + marge%) × (1 − remise%)
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-1.5 font-medium">Poste</th>
                  <th className="text-right py-1.5 font-medium w-28">Remise %</th>
                  <th className="text-right py-1.5 font-medium w-28">Économie client</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <RemiseLigne
                  label="Fournitures (tissu + acc.)"
                  pct={remises.fourniture_pct}
                  base={(chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0) + allocOverhead(
                    chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0),
                    chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0) + chiffrage.mo_confection.total + chiffrage.mo_pose.total + chiffrage.deplacement.total + chiffrage.sous_traitance,
                    chiffrage.overhead_montant
                  )) * (1 + overrides.marge_pct / 100)}
                  onChange={(v) => setRemise("fourniture_pct", v)}
                />
                <RemiseLigne
                  label="Confection atelier"
                  pct={remises.confection_pct}
                  base={(chiffrage.mo_confection.total + allocOverhead(
                    chiffrage.mo_confection.total,
                    chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0) + chiffrage.mo_confection.total + chiffrage.mo_pose.total + chiffrage.deplacement.total + chiffrage.sous_traitance,
                    chiffrage.overhead_montant
                  )) * (1 + overrides.marge_pct / 100)}
                  onChange={(v) => setRemise("confection_pct", v)}
                />
                <RemiseLigne
                  label="Pose sur site"
                  pct={remises.pose_pct}
                  base={(chiffrage.mo_pose.total + allocOverhead(
                    chiffrage.mo_pose.total,
                    chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0) + chiffrage.mo_confection.total + chiffrage.mo_pose.total + chiffrage.deplacement.total + chiffrage.sous_traitance,
                    chiffrage.overhead_montant
                  )) * (1 + overrides.marge_pct / 100)}
                  onChange={(v) => setRemise("pose_pct", v)}
                />
                <RemiseLigne
                  label="Déplacement"
                  pct={remises.deplacement_pct}
                  base={((chiffrage.deplacement.total + chiffrage.sous_traitance) + allocOverhead(
                    chiffrage.deplacement.total + chiffrage.sous_traitance,
                    chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0) + chiffrage.mo_confection.total + chiffrage.mo_pose.total + chiffrage.deplacement.total + chiffrage.sous_traitance,
                    chiffrage.overhead_montant
                  )) * (1 + overrides.marge_pct / 100)}
                  onChange={(v) => setRemise("deplacement_pct", v)}
                />
              </tbody>
            </table>

            {hasRemise && (
              <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded px-3 py-2">
                <span className="text-sm font-medium text-orange-800">Total remises</span>
                <span className="text-sm font-bold text-orange-800">− {remiseMontant.toFixed(2)} €</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ─── Marge & TVA ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Marge & Prix de vente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Slider marge */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Marge commerciale</Label>
              <span className={`text-xl font-bold tabular-nums ${margeColor}`}>
                {overrides.marge_pct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={overrides.marge_pct}
              onChange={(e) => set("marge_pct", Number(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>0%</span>
              <span className="text-red-400">20%</span>
              <span className="text-green-600">35%</span>
              <span>60%</span>
              <span>100%</span>
            </div>
          </div>

          <Separator />

          {/* Prix vente HT — avec ou sans remise */}
          {hasRemise ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prix de vente HT (avant remise)</span>
                <span className="text-base text-muted-foreground line-through">
                  {chiffrage.prix_vente_ht.toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center justify-between bg-orange-50 rounded px-3 py-1.5">
                <span className="text-sm text-orange-700">Remise commerciale</span>
                <span className="text-sm font-semibold text-orange-700">− {remiseMontant.toFixed(2)} €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Prix de vente HT net</span>
                <span className="text-base font-bold">{prixVenteHt.toFixed(2)} €</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prix de vente HT</span>
              <span className="text-base font-bold">{prixVenteHt.toFixed(2)} €</span>
            </div>
          )}

          {/* TVA */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">TVA</Label>
              <select
                value={overrides.tva_taux}
                onChange={(e) => set("tva_taux", Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value={20}>20 %</option>
                <option value={10}>10 %</option>
                <option value={5.5}>5,5 %</option>
                <option value={0}>0 % (exonéré)</option>
              </select>
            </div>
            <span className="text-sm text-muted-foreground">
              +{(prixVenteTtc - prixVenteHt).toFixed(2)} €
            </span>
          </div>

          <Separator />

          {/* Prix TTC */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-base">Prix de vente TTC</span>
            <span className="text-2xl font-bold text-blue-800">
              {prixVenteTtc.toFixed(2)} €
            </span>
          </div>

          {/* Badges résumé */}
          <div className="flex gap-2 flex-wrap pt-1">
            <Badge variant="outline" className="text-xs">
              Coût revient {chiffrage.cout_revient_ht.toFixed(0)} €
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                overrides.marge_pct < 20
                  ? "border-red-300 text-red-700 bg-red-50"
                  : overrides.marge_pct <= 35
                    ? "border-green-300 text-green-700 bg-green-50"
                    : "border-blue-300 text-blue-700 bg-blue-50"
              }`}
            >
              Marge {overrides.marge_pct} %
            </Badge>
            {hasRemise && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                Remise {remiseMontant.toFixed(0)} €
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              TVA {overrides.tva_taux} %
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Ligne remise par poste ───────────────────────────────────────────────────

function RemiseLigne({
  label,
  pct,
  base,
  onChange,
}: {
  label: string;
  pct: number;
  base: number;
  onChange: (v: number) => void;
}) {
  const economie = Math.round(base * pct / 100 * 100) / 100;
  return (
    <tr className={pct > 0 ? "bg-orange-50/30" : ""}>
      <td className="py-2 text-sm">{label}</td>
      <td className="py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={pct || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-7 w-16 text-sm text-right"
            placeholder="0"
          />
          <span className="text-muted-foreground text-xs">%</span>
        </div>
      </td>
      <td className={`py-2 text-right text-sm font-medium ${pct > 0 ? "text-orange-700" : "text-muted-foreground"}`}>
        {pct > 0 ? `− ${economie.toFixed(2)} €` : "—"}
      </td>
    </tr>
  );
}
