"use client";

import type { LambrequinParams } from "@/engine/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LambrequinFieldProps {
  label: string;
  value: LambrequinParams;
  onChange: (value: LambrequinParams) => void;
}

export function LambrequinField({ label, value, onChange }: LambrequinFieldProps) {
  return (
    <div className="space-y-2 p-3 border rounded-md">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.actif}
          onChange={(e) =>
            onChange({ ...value, actif: e.target.checked })
          }
          className="h-4 w-4"
        />
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      {value.actif && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Hauteur (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={value.hauteur_mm || ""}
              onChange={(e) =>
                onChange({ ...value, hauteur_mm: Number(e.target.value) })
              }
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Longueur (mm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={value.longueur_mm || ""}
              onChange={(e) =>
                onChange({ ...value, longueur_mm: Number(e.target.value) })
              }
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}
