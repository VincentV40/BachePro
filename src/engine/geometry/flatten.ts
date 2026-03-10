import type { Point2D } from '../types';

/**
 * Calcule la surface d'un polygone 2D en mm² (formule du lacet / Shoelace).
 */
export function surfacePolygone(vertices: Point2D[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = vertices[i]!;
    const [x2, y2] = vertices[(i + 1) % n]!;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

/**
 * Convertit mm² en m².
 */
export function mm2versM2(surface_mm2: number): number {
  return Math.round((surface_mm2 / 1_000_000) * 100) / 100;
}

/**
 * Calcule la distance entre deux points 2D.
 */
export function distance2D(a: Point2D, b: Point2D): number {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}

/**
 * Déplie le versant de la tente-deux-pans en un rectangle 2D.
 *
 * Le versant est une pièce continue passant par-dessus le faîtage.
 * Développé = retombée_gauche + rampant_gauche + rampant_droit + retombée_droite
 * Longueur = profondeur
 *
 * @returns vertices_2d du rectangle [largeur = développé, hauteur = profondeur]
 */
export function deplierVersant(
  retombee_gauche_mm: number,
  rampant_gauche_mm: number,
  rampant_droit_mm: number,
  retombee_droite_mm: number,
  profondeur_mm: number,
): { vertices_2d: Point2D[]; surface_m2: number; developpe_mm: number } {
  const developpe = retombee_gauche_mm + rampant_gauche_mm + rampant_droit_mm + retombee_droite_mm;

  const vertices_2d: Point2D[] = [
    [0, 0],
    [developpe, 0],
    [developpe, profondeur_mm],
    [0, profondeur_mm],
  ];

  const surface_mm2 = developpe * profondeur_mm;

  return {
    vertices_2d,
    surface_m2: mm2versM2(surface_mm2),
    developpe_mm: developpe,
  };
}

/**
 * Génère le contour 2D d'un pignon (triangle isocèle) pour la découpe.
 *
 * Le pignon est vu de face : base = largeur_base, hauteur = rampant max.
 * Pour le découpage en laizes, on utilise la bounding box : chaque bande est coupée
 * à la hauteur du rampant (longueur max) puis ajustée en forme.
 *
 * @returns vertices_2d du triangle et surface
 */
export function deplierPignon(
  largeur_base_mm: number,
  rampant_mm: number,
): { vertices_2d: Point2D[]; surface_m2: number; hauteur_coupe_mm: number } {
  // Le pignon est un triangle : base en bas, pointe en haut
  // Pour la découpe, hauteur de coupe = rampant (pas la hauteur géométrique du triangle)
  // car on coupe les bandes à la longueur du rampant

  const vertices_2d: Point2D[] = [
    [0, 0],                                    // Bas gauche
    [largeur_base_mm, 0],                      // Bas droit
    [largeur_base_mm / 2, rampant_mm],         // Sommet (faîtage)
  ];

  const surface_mm2 = (largeur_base_mm * rampant_mm) / 2;

  return {
    vertices_2d,
    surface_m2: mm2versM2(surface_mm2),
    hauteur_coupe_mm: rampant_mm,
  };
}
