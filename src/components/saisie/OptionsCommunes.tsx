"use client";

import type { LambrequinParams, OeilletConfig } from "@/engine/types";
import { calculerOptimisationLambrequin } from "@/engine/geometry/lambrequins";
import { defaultOeilletConfig } from "@/engine/geometry/oeillets";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PignonContext {
  largeur_base_mm: number;
  rampant_mm: number;
  hauteur_murs_mm: number;
}

interface LambrequinFieldProps {
  label: string;
  value: LambrequinParams;
  onChange: (value: LambrequinParams) => void;
  pignonContext?: PignonContext;
}

export function LambrequinField({ label, value, onChange, pignonContext }: LambrequinFieldProps) {
  // Calcul optimisation en temps réel si le contexte pignon est disponible
  const optim =
    pignonContext && value.actif && value.hauteur_mm > 0 && value.longueur_mm > 0
      ? calculerOptimisationLambrequin(
          value.longueur_mm,
          value.hauteur_mm,
          pignonContext.largeur_base_mm,
          pignonContext.rampant_mm,
          pignonContext.hauteur_murs_mm,
        )
      : null;

  return (
    <div className="space-y-2 p-3 border rounded-md">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.actif}
            onChange={(e) => onChange({ ...value, actif: e.target.checked })}
            className="h-4 w-4"
          />
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        </label>
        {optim && (
          <Badge
            variant="outline"
            className={
              optim.pris_en_chute
                ? "text-xs text-green-700 border-green-300 bg-green-50"
                : "text-xs text-orange-700 border-orange-300 bg-orange-50"
            }
          >
            {optim.pris_en_chute
              ? `Pris en chute — 0 ML (dispo ${optim.largeur_disponible}mm)`
              : `Panneau dédié requis`}
          </Badge>
        )}
      </div>
      {value.actif && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Hauteur (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={value.hauteur_mm || ""}
              onChange={(e) => onChange({ ...value, hauteur_mm: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Longueur (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={value.longueur_mm || ""}
              onChange={(e) => onChange({ ...value, longueur_mm: Number(e.target.value) })}
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Œillets ───────────────────────────────────────────────

interface OeilletConfigFieldProps {
  value: OeilletConfig | undefined;
  onChange: (value: OeilletConfig) => void;
  nbOeillets?: number; // Nombre calculé (feedback temps réel)
}

export function OeilletConfigField({ value, onChange, nbOeillets }: OeilletConfigFieldProps) {
  const config = value ?? defaultOeilletConfig();

  return (
    <div className="space-y-2 p-3 border rounded-md">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.actif}
            onChange={(e) => onChange({ ...config, actif: e.target.checked })}
            className="h-4 w-4"
          />
          <Label className="text-sm font-medium cursor-pointer">Œillets périphériques</Label>
        </label>
        {config.actif && nbOeillets !== undefined && (
          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">
            {nbOeillets} œillet{nbOeillets > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {config.actif && (
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Diamètre</Label>
            <select
              value={config.diametre_mm}
              onChange={(e) => onChange({ ...config, diametre_mm: Number(e.target.value) })}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={12}>ø 12 mm</option>
              <option value={16}>ø 16 mm</option>
              <option value={20}>ø 20 mm</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Espacement (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={config.espacement_mm || ""}
              onChange={(e) => onChange({ ...config, espacement_mm: Number(e.target.value) })}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Retrait bord (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={config.retrait_bord_mm || ""}
              placeholder="150"
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({ ...config, retrait_bord_mm: val > 0 ? val : 150 });
              }}
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}
