import { v4 as uuidv4 } from 'uuid';
import type { Bande, Point2D } from '../types';
import { arrondirML, RECOUVREMENT_MM } from '@/lib/constants';

/**
 * Découpe un panneau rectangulaire en bandes (laizes).
 *
 * Les bandes couvrent la dimension `largeur_mm` avec des laizes de `laize_mm`.
 * Chaque bande a une longueur = `longueur_mm` (la profondeur du panneau).
 *
 * @param panneau_id - ID du panneau parent
 * @param largeur_mm - Dimension à couvrir par les laizes (développé)
 * @param longueur_mm - Longueur de chaque bande (profondeur + ourlets)
 * @param laize_mm - Largeur utile du tissu
 * @param recouvrement_mm - Recouvrement entre bandes pour soudure
 * @returns Tableau de bandes
 */
export function decouperRectangle(
  panneau_id: string,
  largeur_mm: number,
  longueur_mm: number,
  laize_mm: number,
  recouvrement_mm: number = RECOUVREMENT_MM,
): Bande[] {
  const nombre_laizes = Math.ceil(largeur_mm / laize_mm);
  const bandes: Bande[] = [];

  for (let i = 0; i < nombre_laizes; i++) {
    // Largeur effective de cette bande (la dernière peut être plus étroite)
    const debut = i * laize_mm;
    const fin = Math.min((i + 1) * laize_mm, largeur_mm);
    const largeur_effective = fin - debut;

    bandes.push({
      id: uuidv4(),
      panneau_id,
      numero: i + 1,
      longueur_mm,
      largeur_effective_mm: largeur_effective,
      recouvrement_mm: i < nombre_laizes - 1 ? recouvrement_mm : 0,
      sens_soudure: i % 2 === 0 ? 'gauche-droite' : 'droite-gauche',
    });
  }

  return bandes;
}

/**
 * Découpe un panneau polygonal en bandes verticales.
 * Chaque bande couvre une portion de la largeur du polygone.
 * La longueur de chaque bande = hauteur max du polygone dans cette portion.
 *
 * Utilisé pour les pignons (pentagones, triangles).
 *
 * @param panneau_id - ID du panneau parent
 * @param vertices - Contour 2D du panneau (x = largeur, y = hauteur)
 * @param laize_mm - Largeur utile du tissu
 * @param recouvrement_mm - Recouvrement entre bandes
 * @returns Tableau de bandes
 */
export function decouperPolygone(
  panneau_id: string,
  vertices: Point2D[],
  laize_mm: number,
  recouvrement_mm: number = RECOUVREMENT_MM,
): Bande[] {
  // Trouver la largeur totale (étendue en X)
  const xs = vertices.map(v => v[0]);
  const min_x = Math.min(...xs);
  const max_x = Math.max(...xs);
  const largeur_totale = max_x - min_x;

  const nombre_laizes = Math.ceil(largeur_totale / laize_mm);
  const bandes: Bande[] = [];

  for (let i = 0; i < nombre_laizes; i++) {
    const band_x_start = min_x + i * laize_mm;
    const band_x_end = Math.min(min_x + (i + 1) * laize_mm, max_x);

    // Hauteur max du polygone dans cette bande
    const hauteur_max = maxHauteurPolygoneDansBande(vertices, band_x_start, band_x_end);

    bandes.push({
      id: uuidv4(),
      panneau_id,
      numero: i + 1,
      longueur_mm: hauteur_max,
      largeur_effective_mm: band_x_end - band_x_start,
      recouvrement_mm: i < nombre_laizes - 1 ? recouvrement_mm : 0,
      sens_soudure: i % 2 === 0 ? 'gauche-droite' : 'droite-gauche',
    });
  }

  return bandes;
}

/**
 * Calcule la hauteur max d'un polygone dans une bande verticale [x_start, x_end].
 * Retourne la valeur Y maximale du polygone dans cette plage X.
 */
function maxHauteurPolygoneDansBande(
  vertices: Point2D[],
  x_start: number,
  x_end: number,
): number {
  let max_y = 0;

  // Vérifier tous les sommets dans la bande
  for (const v of vertices) {
    if (v[0] >= x_start && v[0] <= x_end) {
      max_y = Math.max(max_y, v[1]);
    }
  }

  // Vérifier les intersections des arêtes avec les bords de la bande
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;

    // Intersection avec x = x_start
    const y_at_start = interpolerY(a, b, x_start);
    if (y_at_start !== null) max_y = Math.max(max_y, y_at_start);

    // Intersection avec x = x_end
    const y_at_end = interpolerY(a, b, x_end);
    if (y_at_end !== null) max_y = Math.max(max_y, y_at_end);
  }

  return max_y;
}

/**
 * Interpole la valeur Y sur un segment [a, b] à la position X donnée.
 * Retourne null si X est hors du segment.
 */
function interpolerY(a: Point2D, b: Point2D, x: number): number | null {
  const [ax, ay] = a;
  const [bx, by] = b;

  if ((x < Math.min(ax, bx)) || (x > Math.max(ax, bx))) return null;
  if (ax === bx) return Math.max(ay, by); // Segment vertical

  const t = (x - ax) / (bx - ax);
  return ay + t * (by - ay);
}

/**
 * Calcule le ML total d'un ensemble de bandes.
 * Chaque bande est arrondie au décimètre supérieur individuellement.
 */
export function calculerMLTotal(bandes: Bande[]): number {
  let total = 0;
  for (const bande of bandes) {
    total += arrondirML(bande.longueur_mm);
  }
  // Arrondir le total à 2 décimales pour éviter les erreurs de flottants
  return Math.round(total * 100) / 100;
}
