import type { OeilletConfig, Point2D } from '../types';

const DIAMETRE_DEFAUT = 16;     // mm
const ESPACEMENT_DEFAUT = 300;  // mm
const RETRAIT_DEFAUT = 25;      // mm

/** Valeurs par défaut pour une config œillet */
export function defaultOeilletConfig(): OeilletConfig {
  return {
    actif: false,
    diametre_mm: DIAMETRE_DEFAUT,
    espacement_mm: ESPACEMENT_DEFAUT,
    retrait_bord_mm: RETRAIT_DEFAUT,
  };
}

/**
 * Calcule les positions des œillets sur le périmètre d'un panneau.
 *
 * Les œillets sont répartis régulièrement le long de chaque arête avec :
 * - un retrait aux deux extrémités (retrait_bord_mm)
 * - un espacement régulier entre eux (espacement_mm)
 *
 * @returns Tableau de positions 2D (dans l'espace du panneau, en mm)
 */
export function calculerPositionsOeillets(
  vertices_2d: Point2D[],
  config: OeilletConfig,
): Point2D[] {
  if (!config.actif || vertices_2d.length < 2) return [];

  const { espacement_mm, retrait_bord_mm } = config;
  const positions: Point2D[] = [];
  const n = vertices_2d.length;

  for (let i = 0; i < n; i++) {
    const a = vertices_2d[i]!;
    const b = vertices_2d[(i + 1) % n]!;

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    // Arête trop courte pour placer même un seul œillet avec le retrait
    if (len <= 2 * retrait_bord_mm) continue;

    const ux = dx / len;
    const uy = dy / len;

    const start = retrait_bord_mm;
    const end = len - retrait_bord_mm;
    const count = Math.floor((end - start) / espacement_mm) + 1;

    for (let j = 0; j < count; j++) {
      const t = start + j * Math.min(espacement_mm, end - start); // dernier pas adapté
      if (t <= end + 0.01) {
        positions.push([a[0] + ux * t, a[1] + uy * t]);
      }
    }
  }

  return positions;
}

/**
 * Compte le nombre total d'œillets sur tous les panneaux d'un patronage.
 */
export function compterOeilletsTotaux(
  panneaux: { vertices_2d: Point2D[] }[],
  config: OeilletConfig,
): number {
  if (!config.actif) return 0;
  return panneaux.reduce(
    (total, p) => total + calculerPositionsOeillets(p.vertices_2d, config).length,
    0,
  );
}
