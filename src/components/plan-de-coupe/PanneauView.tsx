"use client";

import { useState } from "react";
import type { OeilletConfig, Panneau } from "@/engine/types";
import { calculerPositionsOeillets } from "@/engine/geometry/oeillets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { arrondirML } from "@/lib/constants";
import { Maximize2 } from "lucide-react";

// Couleurs par ID de panneau
const PANEL_FILL: Record<string, string> = {
  versant: "#DBEAFE",
  "pignon-avant": "#FEF9C3",
  "pignon-arriere": "#DCFCE7",
};
function getPanelFill(id: string): string {
  if (id.startsWith("lambrequin")) return "#FFEDD5";
  return PANEL_FILL[id] ?? "#F3F4F6";
}

// Préfixe court pour les labels de bandes (ex: V-B1, PA-B2)
function getBandePrefix(panneauId: string): string {
  if (panneauId === "versant") return "V";
  if (panneauId === "pignon-avant") return "PA";
  if (panneauId === "pignon-arriere") return "PAR";
  if (panneauId.startsWith("lambrequin-g")) return "LG";
  if (panneauId.startsWith("lambrequin-d")) return "LD";
  return panneauId.slice(0, 2).toUpperCase();
}

interface Props {
  panneau: Panneau;
  oeillets_config?: OeilletConfig;
}

export default function PanneauView({ panneau, oeillets_config }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  if (panneau.bandes.length === 0 || panneau.vertices_2d.length === 0) return null;

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">{panneau.nom}</CardTitle>
            <div className="flex gap-2 flex-wrap items-center">
              <Badge variant="outline" className="text-xs">
                {panneau.bandes.length} laize{panneau.bandes.length > 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold text-blue-700">
                {Math.round(panneau.bandes.reduce((a, b) => a + arrondirML(b.longueur_mm), 0) * 100) / 100} ML
              </Badge>
              <Badge variant="outline" className="text-xs">{panneau.surface_m2} m²</Badge>
              <button
                onClick={() => setFullscreen(true)}
                className="ml-1 p-1 rounded hover:bg-muted transition-colors"
                title="Plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PanneauSVG panneau={panneau} oeillets_config={oeillets_config} compact />
        </CardContent>
      </Card>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>{panneau.nom}</DialogTitle>
          </DialogHeader>
          <PanneauSVG panneau={panneau} oeillets_config={oeillets_config} compact={false} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Composant SVG partagé (compact vs plein écran) ───────────────────────

function PanneauSVG({
  panneau,
  oeillets_config,
  compact,
}: {
  panneau: Panneau;
  oeillets_config?: OeilletConfig;
  compact: boolean;
}) {
  const fill = getPanelFill(panneau.id);
  const prefix = getBandePrefix(panneau.id);
  const clipId = `clip-${panneau.id}-${compact ? "c" : "f"}`;
  const hatchId = `hatch-${panneau.id}-${compact ? "c" : "f"}`;

  // Bounding box depuis le polygone
  const xs = panneau.vertices_2d.map((v) => v[0]);
  const ys = panneau.vertices_2d.map((v) => v[1]);
  const x_min = Math.min(...xs);
  const x_max = Math.max(...xs);
  const y_min = Math.min(...ys);
  const y_max = Math.max(...ys);
  const bbox_w = x_max - x_min;
  const bbox_h = y_max - y_min;

  // Rotation auto si panneau portrait très allongé
  const shouldRotate = bbox_h > bbox_w * 1.5;

  const display_W = shouldRotate ? bbox_h : bbox_w;
  const display_H = shouldRotate ? bbox_w : bbox_h;

  const PAD = compact ? 36 : 56;
  const FORMULA_H = panneau.formule_calcul ? 68 : 52;
  const MAX_W = compact ? 620 : 900;
  const MAX_H = compact ? 180 : 360;
  const scale = Math.min((MAX_W - PAD * 2) / display_W, (MAX_H - PAD * 2) / display_H);

  const draw_W = display_W * scale;
  const draw_H = display_H * scale;
  const svg_w = Math.round(draw_W + PAD * 2);
  const svg_h = Math.round(draw_H + PAD * 2 + FORMULA_H);

  const toSvg = (x_orig: number, y_orig: number): [number, number] => {
    if (shouldRotate) {
      return [PAD + y_orig * scale, PAD + x_orig * scale];
    } else {
      return [PAD + (x_orig - x_min) * scale, PAD + (y_max - y_orig) * scale];
    }
  };

  const polygonPoints = panneau.vertices_2d.map(([x, y]) => toSvg(x, y).join(",")).join(" ");

  const bandeOffsets: number[] = [];
  let cumX = x_min;
  for (const b of panneau.bandes) {
    bandeOffsets.push(cumX);
    cumX += b.largeur_effective_mm;
  }

  const n = panneau.bandes.length;
  const laize_effective = panneau.bandes[0]!.largeur_effective_mm;
  const longueur_mm = panneau.bandes[0]?.longueur_mm ?? 0;
  const developpe = Math.round(bbox_w);
  const mlTotal = Math.round(panneau.bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0) * 100) / 100;
  const sens = panneau.bandes[0]?.sens_soudure ?? "gauche-droite";

  // Œillets
  const oeilletPositionsSvg = oeillets_config
    ? calculerPositionsOeillets(panneau.vertices_2d, oeillets_config).map(([x, y]) => toSvg(x, y))
    : [];
  const oeillet_r = Math.max(2, Math.min(5, ((oeillets_config?.diametre_mm ?? 16) * scale) / 2));

  return (
    <svg
      viewBox={`0 0 ${svg_w} ${svg_h}`}
      style={{ width: svg_w, height: svg_h, maxWidth: "100%", display: "block" }}
    >
      <defs>
        <pattern
          id={hatchId}
          patternUnits="userSpaceOnUse"
          width={6}
          height={6}
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke="#1E40AF" strokeWidth={1.2} opacity={0.5} />
        </pattern>
        <clipPath id={clipId}>
          <polygon points={polygonPoints} />
        </clipPath>
      </defs>

      {/* Fond du polygone */}
      <polygon points={polygonPoints} fill={fill} stroke="none" />

      {/* Bandes clipées */}
      <g clipPath={`url(#${clipId})`}>
        {panneau.bandes.map((bande, i) => {
          const offset = bandeOffsets[i]!;
          const bandLabel = `${prefix}-B${bande.numero}`;

          if (shouldRotate) {
            const [, by_top] = toSvg(offset, 0);
            const bh = bande.largeur_effective_mm * scale;
            const full_w = bbox_h * scale;
            const overlapH = bande.recouvrement_mm * scale;

            return (
              <g key={bande.id}>
                {i > 0 && (
                  <line x1={PAD} y1={by_top} x2={PAD + full_w} y2={by_top}
                    stroke="#374151" strokeWidth={0.8} strokeDasharray="4,2" />
                )}
                {overlapH > 0 && (
                  <rect x={PAD} y={by_top + bh - overlapH} width={full_w} height={overlapH}
                    fill={`url(#${hatchId})`} />
                )}
                <text x={PAD + full_w / 2} y={by_top + bh / 2 - 7}
                  textAnchor="middle" fontSize={Math.min(12, Math.max(8, bh / 2.5))}
                  fontWeight="bold" fill="#1E40AF">
                  {bandLabel}
                </text>
                <text x={PAD + full_w / 2} y={by_top + bh / 2 + 5}
                  textAnchor="middle" fontSize={Math.min(9, Math.max(7, bh / 3.5))} fill="#374151">
                  {bande.largeur_effective_mm}mm × {(bande.longueur_mm / 1000).toFixed(2)}m
                </text>
              </g>
            );
          } else {
            const [bx] = toSvg(offset, y_max);
            const bw = bande.largeur_effective_mm * scale;
            const by = PAD;
            const bh = bbox_h * scale;
            const overlapW = bande.recouvrement_mm * scale;

            return (
              <g key={bande.id}>
                {i > 0 && (
                  <line x1={bx} y1={by} x2={bx} y2={by + bh}
                    stroke="#374151" strokeWidth={0.8} strokeDasharray="4,2" />
                )}
                {overlapW > 0 && (
                  <rect x={bx + bw - overlapW} y={by} width={overlapW} height={bh}
                    fill={`url(#${hatchId})`} />
                )}
                <text x={bx + bw / 2} y={by + bh / 2 - 7}
                  textAnchor="middle" fontSize={Math.min(12, Math.max(8, bw / 2.5))}
                  fontWeight="bold" fill="#1E40AF">
                  {bandLabel}
                </text>
                <text x={bx + bw / 2} y={by + bh / 2 + 5}
                  textAnchor="middle" fontSize={Math.min(9, Math.max(7, bw / 4))} fill="#374151">
                  {bande.largeur_effective_mm}mm
                </text>
                <text x={bx + bw / 2} y={by + bh / 2 + 16}
                  textAnchor="middle" fontSize={Math.min(9, Math.max(7, bw / 4))} fill="#374151">
                  {(bande.longueur_mm / 1000).toFixed(2)}m
                </text>
              </g>
            );
          }
        })}
      </g>

      {/* Contour par-dessus */}
      <polygon points={polygonPoints} fill="none" stroke="#374151" strokeWidth={1.5} />

      {/* Œillets */}
      {oeilletPositionsSvg.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={oeillet_r} fill="white" stroke="#1E40AF" strokeWidth={1} />
      ))}

      {/* Cotations */}
      {shouldRotate ? (
        <>
          <CotationLine
            x1={PAD} y1={PAD + display_H * scale + 8}
            x2={PAD + display_W * scale} y2={PAD + display_H * scale + 8}
            label={`${Math.round(display_W)} mm`}
          />
          <CotationLine
            x1={PAD + display_W * scale + 8} y1={PAD}
            x2={PAD + display_W * scale + 8} y2={PAD + display_H * scale}
            label={`${Math.round(display_H)} mm`}
            vertical
          />
        </>
      ) : (
        <>
          <CotationLine
            x1={PAD} y1={PAD + bbox_h * scale + 8}
            x2={PAD + bbox_w * scale} y2={PAD + bbox_h * scale + 8}
            label={`${developpe} mm`}
          />
          <CotationLine
            x1={PAD + bbox_w * scale + 8} y1={PAD}
            x2={PAD + bbox_w * scale + 8} y2={PAD + bbox_h * scale}
            label={`${longueur_mm} mm`}
            vertical
          />
        </>
      )}

      {/* Flèche sens soudure */}
      <text
        x={PAD + 4}
        y={PAD + display_H * scale + 22}
        fontSize={8} fill="#6B7280" fontStyle="italic"
      >
        {sens === "gauche-droite" ? "→ Sens soudure" : "← Sens soudure"}
      </text>

      {/* Formule décomposée */}
      {panneau.formule_calcul && (
        <text
          x={PAD} y={svg_h - FORMULA_H + 14}
          fontSize={8} fontFamily="monospace" fill="#6B7280"
        >
          {panneau.formule_calcul}
        </text>
      )}
      <text
        x={PAD} y={svg_h - FORMULA_H + (panneau.formule_calcul ? 30 : 18)}
        fontSize={9} fontFamily="monospace" fill="#374151"
      >
        {`(${developpe}mm ÷ ${laize_effective}mm laize) → ${n} laize${n > 1 ? "s" : ""}  ×  ${arrondirML(longueur_mm).toFixed(2)} ML`}
      </text>
      <text
        x={PAD} y={svg_h - FORMULA_H + (panneau.formule_calcul ? 46 : 33)}
        fontSize={10} fontFamily="monospace" fontWeight="bold" fill="#1E40AF"
      >
        {`${n} × ${arrondirML(longueur_mm).toFixed(2)} = ${mlTotal} ML`}
      </text>
    </svg>
  );
}

// ─── Ligne de cotation ───────────────────────────────────────────────────────

function CotationLine({
  x1, y1, x2, y2, label, vertical = false,
}: {
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean;
}) {
  const BLUE = "#1E40AF";
  const ARROW = 5;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  if (!vertical) {
    return (
      <g>
        <line x1={x1} y1={y1 - 6} x2={x1} y2={y1} stroke={BLUE} strokeWidth={0.5} />
        <line x1={x2} y1={y2 - 6} x2={x2} y2={y2} stroke={BLUE} strokeWidth={0.5} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BLUE} strokeWidth={0.8} />
        <polygon points={`${x1},${y1} ${x1 + ARROW},${y1 - 2} ${x1 + ARROW},${y1 + 2}`} fill={BLUE} />
        <polygon points={`${x2},${y2} ${x2 - ARROW},${y2 - 2} ${x2 - ARROW},${y2 + 2}`} fill={BLUE} />
        <text x={mx} y={y1 - 2} textAnchor="middle" fontSize={9} fill={BLUE} fontWeight="bold">
          {label}
        </text>
      </g>
    );
  }

  return (
    <g>
      <line x1={x1 - 6} y1={y1} x2={x1} y2={y1} stroke={BLUE} strokeWidth={0.5} />
      <line x1={x2 - 6} y1={y2} x2={x2} y2={y2} stroke={BLUE} strokeWidth={0.5} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BLUE} strokeWidth={0.8} />
      <polygon points={`${x1},${y1} ${x1 - 2},${y1 + ARROW} ${x1 + 2},${y1 + ARROW}`} fill={BLUE} />
      <polygon points={`${x2},${y2} ${x2 - 2},${y2 - ARROW} ${x2 + 2},${y2 - ARROW}`} fill={BLUE} />
      <text
        x={x1 + 12} y={my}
        textAnchor="middle" fontSize={9} fill={BLUE} fontWeight="bold"
        transform={`rotate(-90, ${x1 + 12}, ${my})`}
      >
        {label}
      </text>
    </g>
  );
}
