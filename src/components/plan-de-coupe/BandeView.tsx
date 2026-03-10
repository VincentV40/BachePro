"use client";

import type { Bande } from "@/engine/types";

interface Props {
  bande: Bande;
  x: number;
  y: number;
  scale: number;
  index: number;
}

const COLORS = ["#f1f5f9", "#e2e8f0"]; // Alternance gris clair

export default function BandeView({ bande, x, y, scale, index }: Props) {
  const w = bande.largeur_effective_mm * scale;
  const h = bande.longueur_mm * scale;
  const fill = COLORS[index % 2]!;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke="#000"
        strokeWidth={0.5}
      />
      {/* Numero de bande */}
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fill="#64748b"
      >
        B{bande.numero}
      </text>
      {/* Recouvrement */}
      {bande.recouvrement_mm > 0 && (
        <rect
          x={x + w - bande.recouvrement_mm * scale}
          y={y}
          width={bande.recouvrement_mm * scale}
          height={h}
          fill="rgba(30, 64, 175, 0.15)"
          stroke="#1E40AF"
          strokeWidth={0.3}
          strokeDasharray="2,2"
        />
      )}
    </g>
  );
}
