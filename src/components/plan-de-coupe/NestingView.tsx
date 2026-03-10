"use client";

import type { Panneau } from "@/engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { arrondirML } from "@/lib/constants";

interface Props {
  panneaux: Panneau[];
  laize_mm: number;
}

export default function NestingView({ panneaux, laize_mm }: Props) {
  // Collecter toutes les bandes avec leur origine panneau
  const bandes = panneaux.flatMap((p) =>
    p.bandes.map((b) => ({ ...b, panneau_nom: p.nom }))
  );

  const mlTotal = bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0);
  const totalMM = mlTotal * 1000;

  // Scale : le rouleau fait laize_mm de haut et totalMM de long
  const svgWidth = 700;
  const svgHeight = 80;
  const padding = 10;
  const scale = (svgWidth - padding * 2) / totalMM;
  const bandHeight = svgHeight - padding * 2;

  // Couleurs par panneau
  const panneauColors: Record<string, string> = {};
  const colorPalette = ["#dbeafe", "#fef3c7", "#d1fae5", "#fce7f3", "#e0e7ff"];
  let colorIdx = 0;

  let xOffset = padding;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Placement sur rouleau — {Math.round(mlTotal * 100) / 100} ML (laize {laize_mm}mm)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full">
          {/* Fond rouleau */}
          <rect
            x={padding}
            y={padding}
            width={svgWidth - padding * 2}
            height={bandHeight}
            fill="#fafafa"
            stroke="#d4d4d8"
            strokeWidth={1}
          />

          {/* Bandes placées séquentiellement */}
          {bandes.map((bande) => {
            const w = arrondirML(bande.longueur_mm) * 1000 * scale;

            if (!panneauColors[bande.panneau_nom]) {
              panneauColors[bande.panneau_nom] = colorPalette[colorIdx % colorPalette.length]!;
              colorIdx++;
            }
            const fill = panneauColors[bande.panneau_nom]!;

            const el = (
              <g key={bande.id}>
                <rect
                  x={xOffset}
                  y={padding}
                  width={w}
                  height={bandHeight}
                  fill={fill}
                  stroke="#000"
                  strokeWidth={0.5}
                />
                <text
                  x={xOffset + w / 2}
                  y={padding + bandHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill="#374151"
                >
                  {arrondirML(bande.longueur_mm)}m
                </text>
              </g>
            );

            xOffset += w;
            return el;
          })}
        </svg>

        {/* Légende */}
        <div className="flex gap-4 mt-2 flex-wrap">
          {Object.entries(panneauColors).map(([nom, color]) => (
            <div key={nom} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span>{nom}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
