"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ResultatPatronage, Tissu, Chiffrage } from "@/engine/types";
import { calculerChiffrage } from "@/engine/chiffrage/cout-revient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  onChiffrageChange?: (chiffrage: Chiffrage) => void;
}

export default function CoutDeRevient({ resultat, tissu, onChiffrageChange }: Props) {
  const [overrides, setOverrides] = useState({
    heures_confection: undefined as number | undefined,
    heures_pose: undefined as number | undefined,
    nb_poseurs: undefined as number | undefined,
    km_deplacement: 0,
    sous_traitance: 0,
    marge_pct: 35,
  });

  const chiffrage = useMemo(() => {
    return calculerChiffrage(resultat, tissu, overrides);
  }, [resultat, tissu, overrides]);

  useEffect(() => {
    onChiffrageChange?.(chiffrage);
  }, [chiffrage, onChiffrageChange]);

  const setOverride = useCallback(<K extends keyof typeof overrides>(key: K, value: (typeof overrides)[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Couleur de la marge
  const margeColor =
    chiffrage.marge_pct < 20 ? "text-red-600" :
    chiffrage.marge_pct < 30 ? "text-orange-500" :
    "text-green-600";

  return (
    <div className="space-y-6">
      {/* Matière */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Matiere</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>{chiffrage.matiere.tissu_ml} ML x {chiffrage.matiere.prix_ml} €/ML</span>
            <span className="font-medium">{chiffrage.matiere.total.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Main d'oeuvre */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Main d&apos;oeuvre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs">Confection (h)</Label>
              <Input
                type="number"
                inputMode="numeric"
                step="0.5"
                value={overrides.heures_confection ?? chiffrage.mo_confection.heures}
                onChange={(e) => setOverride("heures_confection", e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 text-sm"
              />
            </div>
            <div className="text-sm text-right col-span-2">
              {chiffrage.mo_confection.heures}h x {chiffrage.mo_confection.taux}€ = <span className="font-medium">{chiffrage.mo_confection.total.toFixed(2)} €</span>
              {chiffrage.mo_confection.auto_estime && <span className="text-xs text-muted-foreground ml-1">(auto)</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs">Pose (h)</Label>
              <Input
                type="number"
                inputMode="numeric"
                step="0.5"
                value={overrides.heures_pose ?? chiffrage.mo_pose.heures}
                onChange={(e) => setOverride("heures_pose", e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Poseurs</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={overrides.nb_poseurs ?? chiffrage.mo_pose.nb_poseurs}
                onChange={(e) => setOverride("nb_poseurs", e.target.value ? Number(e.target.value) : undefined)}
                className="h-8 text-sm"
              />
            </div>
            <div className="text-sm text-right">
              <span className="font-medium">{chiffrage.mo_pose.total.toFixed(2)} €</span>
              {chiffrage.mo_pose.auto_estime && <span className="text-xs text-muted-foreground ml-1">(auto)</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deplacement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Deplacement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs">Distance (km)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={overrides.km_deplacement}
                onChange={(e) => setOverride("km_deplacement", Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div className="text-sm text-right col-span-2">
              {chiffrage.deplacement.km}km x {chiffrage.deplacement.cout_km}€ = <span className="font-medium">{chiffrage.deplacement.total.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Synthese</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overhead ({chiffrage.overhead_pct}%)</span>
            <span>{chiffrage.overhead_montant.toFixed(2)} €</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-medium">
            <span>Cout de revient HT</span>
            <span>{chiffrage.cout_revient_ht.toFixed(2)} €</span>
          </div>

          <div className="pt-2">
            <Label className="text-xs">Marge (%)</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={overrides.marge_pct}
                onChange={(e) => setOverride("marge_pct", Number(e.target.value))}
                className="flex-1"
              />
              <span className={`text-lg font-bold w-16 text-right ${margeColor}`}>
                {overrides.marge_pct}%
              </span>
            </div>
          </div>

          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Prix de vente HT</span>
            <span>{chiffrage.prix_vente_ht.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-blue-800">
            <span>Prix TTC ({chiffrage.tva_taux}%)</span>
            <span>{chiffrage.prix_vente_ttc.toFixed(2)} €</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
