"use client";

import type { Panneau, Tissu } from "@/engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { arrondirML } from "@/lib/constants";

// Palette de couleurs par panneau (alignée avec PanneauView)
const COLOR_MAP: Record<string, string> = {
  versant: "#DBEAFE",
  "pignon-avant": "#FEF9C3",
  "pignon-arriere": "#DCFCE7",
};
const COLOR_FALLBACK = ["#FFEDD5", "#E0E7FF", "#FCE7F3", "#D1FAE5", "#FEF3C7"];

function getPanelColor(panneauId: string, fallbackIdx: number): string {
  if (panneauId.startsWith("lambrequin")) return "#FFEDD5";
  return COLOR_MAP[panneauId] ?? COLOR_FALLBACK[fallbackIdx % COLOR_FALLBACK.length]!;
}

interface Props {
  panneaux: Panneau[];
  laize_mm: number;
  tissu?: Tissu;
}

export default function NestingView({ panneaux, laize_mm, tissu }: Props) {
  // Toutes les bandes avec leur info panneau
  let fallbackIdx = 0;
  const bandes = panneaux.flatMap((p) => {
    const color = getPanelColor(p.id, fallbackIdx++);
    return p.bandes.map((b) => ({
      ...b,
      panneau_nom: p.nom,
      panneau_id: p.id,
      color,
    }));
  });

  const mlTotal = Math.round(bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0) * 100) / 100;
  const totalMM = mlTotal * 1000;

  // Surface utile vs surface consommée (pour le taux de chute)
  const surfaceUtile = panneaux.reduce((acc, p) => acc + p.surface_m2, 0);
  const surfaceConsommee = (totalMM / 1000) * (laize_mm / 1000);
  const tauxChute = Math.round((1 - surfaceUtile / surfaceConsommee) * 1000) / 10;

  // Coût tissu HT si disponible
  const coutTissuHT = tissu ? Math.round(mlTotal * tissu.prix_ml_ht * 100) / 100 : null;

  // Dimensions SVG
  const SVG_W = 720;
  const ROULEAU_H = 70;
  const PAD = 12;
  const LABEL_H = 16;
  const SVG_H = PAD + LABEL_H + ROULEAU_H + PAD;

  const availW = SVG_W - PAD * 2;
  const scale = availW / totalMM;

  // Légende (panneaux uniques)
  const legendeItems: { id: string; nom: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const b of bandes) {
    if (!seen.has(b.panneau_id)) {
      seen.add(b.panneau_id);
      legendeItems.push({ id: b.panneau_id, nom: b.panneau_nom, color: b.color });
    }
  }

  let xOffset = PAD;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Placement sur rouleau — Laize {laize_mm} mm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
          {/* Fond rouleau */}
          <rect
            x={PAD}
            y={PAD + LABEL_H}
            width={availW}
            height={ROULEAU_H}
            fill="#fafafa"
            stroke="#d4d4d8"
            strokeWidth={1}
            rx={2}
          />

          {/* Bandes séquentielles */}
          {bandes.map((bande) => {
            const bw = Math.max(1, arrondirML(bande.longueur_mm) * 1000 * scale);
            const bx = xOffset;
            const by = PAD + LABEL_H;

            const el = (
              <g key={bande.id}>
                <rect
                  x={bx}
                  y={by}
                  width={bw}
                  height={ROULEAU_H}
                  fill={bande.color}
                  stroke="#9ca3af"
                  strokeWidth={0.5}
                />
                {/* Étiquette si bande assez large */}
                {bw > 30 && (
                  <>
                    <text
                      x={bx + bw / 2}
                      y={by + ROULEAU_H / 2 - 7}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight="bold"
                      fill="#374151"
                    >
                      {bande.panneau_nom}
                    </text>
                    <text
                      x={bx + bw / 2}
                      y={by + ROULEAU_H / 2 + 4}
                      textAnchor="middle"
                      fontSize={7}
                      fill="#6B7280"
                    >
                      B{bande.numero} — {arrondirML(bande.longueur_mm)}m
                    </text>
                  </>
                )}
                {/* Séparateur de bande */}
                <line
                  x1={bx}
                  y1={by}
                  x2={bx}
                  y2={by + ROULEAU_H}
                  stroke="#6b7280"
                  strokeWidth={0.7}
                />
                {/* Cote ML en haut */}
                {bw > 20 && (
                  <text
                    x={bx + bw / 2}
                    y={by + LABEL_H - 2 - LABEL_H}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#1E40AF"
                  >
                    {arrondirML(bande.longueur_mm)}m
                  </text>
                )}
              </g>
            );

            xOffset += bw;
            return el;
          })}
        </svg>

        {/* Légende */}
        <div className="flex gap-4 flex-wrap">
          {legendeItems.map((item) => (
            <div key={item.id} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700">{item.nom}</span>
            </div>
          ))}
        </div>

        {/* Ligne de totalisation */}
        <div className="flex gap-6 flex-wrap text-sm border-t pt-2">
          <div>
            <span className="text-muted-foreground">ML total :</span>{" "}
            <span className="font-semibold text-blue-800">{mlTotal} ML</span>
          </div>
          <div>
            <span className="text-muted-foreground">Chute estimée :</span>{" "}
            <span className="font-semibold">{tauxChute} %</span>
          </div>
          {coutTissuHT !== null && (
            <div>
              <span className="text-muted-foreground">Coût tissu HT :</span>{" "}
              <span className="font-semibold text-green-700">{coutTissuHT.toFixed(2)} €</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Laize :</span>{" "}
            <span className="font-semibold">{laize_mm} mm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
