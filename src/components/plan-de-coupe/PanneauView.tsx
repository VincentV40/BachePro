"use client";

import type { Panneau } from "@/engine/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BandeView from "./BandeView";
import { Cotation } from "./CotationLayer";
import { arrondirML } from "@/lib/constants";

interface Props {
  panneau: Panneau;
}

export default function PanneauView({ panneau }: Props) {
  if (panneau.bandes.length === 0) return null;

  // Dimensions du panneau pour le scale
  const maxLongueur = Math.max(...panneau.bandes.map((b) => b.longueur_mm));
  const totalLargeur = panneau.bandes.reduce((acc, b) => acc + b.largeur_effective_mm, 0);

  // Scale pour tenir dans ~400px de large
  const svgMaxWidth = 400;
  const svgMaxHeight = 300;
  const scaleX = (svgMaxWidth - 60) / totalLargeur;
  const scaleY = (svgMaxHeight - 60) / maxLongueur;
  const scale = Math.min(scaleX, scaleY);

  const drawWidth = totalLargeur * scale;
  const drawHeight = maxLongueur * scale;
  const padding = 30;

  const mlTotal = panneau.bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{panneau.nom}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{panneau.bandes.length} laize{panneau.bandes.length > 1 ? "s" : ""}</Badge>
            <Badge variant="outline">{Math.round(mlTotal * 100) / 100} ML</Badge>
            <Badge variant="outline">{panneau.surface_m2} m²</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${drawWidth + padding * 2} ${drawHeight + padding * 2}`}
          className="w-full max-h-[300px]"
        >
          <g transform={`translate(${padding}, ${padding})`}>
            {/* Bandes */}
            {panneau.bandes.map((bande, i) => {
              const x = panneau.bandes
                .slice(0, i)
                .reduce((acc, b) => acc + b.largeur_effective_mm * scale, 0);
              return (
                <BandeView
                  key={bande.id}
                  bande={bande}
                  x={x}
                  y={0}
                  scale={scale}
                  index={i}
                />
              );
            })}

            {/* Cotation largeur totale */}
            <Cotation
              x1={0}
              y1={drawHeight}
              x2={drawWidth}
              y2={drawHeight}
              label={`${totalLargeur} mm`}
              side="bottom"
            />

            {/* Cotation longueur */}
            <Cotation
              x1={drawWidth}
              y1={0}
              x2={drawWidth}
              y2={drawHeight}
              label={`${maxLongueur} mm`}
              side="right"
            />
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
