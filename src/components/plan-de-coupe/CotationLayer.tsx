"use client";

const COTE_COLOR = "#1E40AF";
const FONT_SIZE = 11;
const ARROW_SIZE = 6;
const OFFSET = 20;

interface CotationProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Cotation({ x1, y1, x2, y2, label, side = "top" }: CotationProps) {
  // Décaler la cotation selon le côté
  let dx = 0, dy = 0;
  if (side === "top") dy = -OFFSET;
  else if (side === "bottom") dy = OFFSET;
  else if (side === "left") dx = -OFFSET;
  else if (side === "right") dx = OFFSET;

  const sx1 = x1 + dx;
  const sy1 = y1 + dy;
  const sx2 = x2 + dx;
  const sy2 = y2 + dy;
  const mx = (sx1 + sx2) / 2;
  const my = (sy1 + sy2) / 2;

  // Angle de la ligne
  const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return (
    <g>
      {/* Lignes d'attache */}
      <line x1={x1} y1={y1} x2={sx1} y2={sy1} stroke={COTE_COLOR} strokeWidth={0.5} />
      <line x1={x2} y1={y2} x2={sx2} y2={sy2} stroke={COTE_COLOR} strokeWidth={0.5} />

      {/* Ligne de cote */}
      <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={COTE_COLOR} strokeWidth={1} />

      {/* Flèches */}
      <polygon
        points={`${sx1},${sy1} ${sx1 + ARROW_SIZE * cos - ARROW_SIZE * 0.4 * sin},${sy1 + ARROW_SIZE * sin + ARROW_SIZE * 0.4 * cos} ${sx1 + ARROW_SIZE * cos + ARROW_SIZE * 0.4 * sin},${sy1 + ARROW_SIZE * sin - ARROW_SIZE * 0.4 * cos}`}
        fill={COTE_COLOR}
      />
      <polygon
        points={`${sx2},${sy2} ${sx2 - ARROW_SIZE * cos - ARROW_SIZE * 0.4 * sin},${sy2 - ARROW_SIZE * sin + ARROW_SIZE * 0.4 * cos} ${sx2 - ARROW_SIZE * cos + ARROW_SIZE * 0.4 * sin},${sy2 - ARROW_SIZE * sin - ARROW_SIZE * 0.4 * cos}`}
        fill={COTE_COLOR}
      />

      {/* Texte */}
      <text
        x={mx}
        y={my - 4}
        textAnchor="middle"
        fill={COTE_COLOR}
        fontSize={FONT_SIZE}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}
