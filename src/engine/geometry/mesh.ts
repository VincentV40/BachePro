import type { Mesh3D, Point3D, TenteDeuxPansParams } from '../types';

/**
 * Génère un mesh 3D pour une tente deux pans.
 *
 * Repère : X = largeur (perpendiculaire au faîtage), Y = hauteur, Z = profondeur (le long du faîtage)
 *
 * La structure est une tente à faîtage central avec deux pentes et des murs latéraux bas.
 * Le rampant est la longueur de chaque pente (du haut du mur au faîtage).
 */
export function genererMeshTenteDeuxPans(params: TenteDeuxPansParams): Mesh3D {
  const { largeur_base_mm, profondeur_mm, rampant_gauche_mm, rampant_droit_mm, hauteur_murs_mm } = params;

  const demi_largeur = largeur_base_mm / 2;

  // Calculer la hauteur du faîtage à partir du rampant et de la demi-largeur
  // rampant² = (hauteur_faitAge - hauteur_murs)² + demi_largeur²
  // hauteur_triangle = sqrt(rampant² - demi_largeur²)
  const h_triangle_gauche = Math.sqrt(
    Math.max(0, rampant_gauche_mm ** 2 - demi_largeur ** 2)
  );
  const h_triangle_droit = Math.sqrt(
    Math.max(0, rampant_droit_mm ** 2 - demi_largeur ** 2)
  );
  // Moyenne si asymétrique (rare)
  const hauteur_faitAge = hauteur_murs_mm + (h_triangle_gauche + h_triangle_droit) / 2;

  // 8 vertices de la structure
  // Base (y = 0)
  const vertices: Point3D[] = [
    // Bas gauche avant (0)
    [-demi_largeur, 0, 0],
    // Bas droit avant (1)
    [demi_largeur, 0, 0],
    // Bas droit arrière (2)
    [demi_largeur, 0, profondeur_mm],
    // Bas gauche arrière (3)
    [-demi_largeur, 0, profondeur_mm],
    // Haut mur gauche avant (4)
    [-demi_largeur, hauteur_murs_mm, 0],
    // Haut mur droit avant (5)
    [demi_largeur, hauteur_murs_mm, 0],
    // Haut mur droit arrière (6)
    [demi_largeur, hauteur_murs_mm, profondeur_mm],
    // Haut mur gauche arrière (7)
    [-demi_largeur, hauteur_murs_mm, profondeur_mm],
    // Faîtage avant (8)
    [0, hauteur_faitAge, 0],
    // Faîtage arrière (9)
    [0, hauteur_faitAge, profondeur_mm],
  ];

  const faces = [
    // Versant (la bâche passe par-dessus le faîtage = une seule face conceptuelle,
    // mais géométriquement c'est 2 faces triangulaires par pente)
    // Versant gauche : quad 7-4-8-9
    { indices: [7, 4, 8, 9], nom: 'versant-gauche' },
    // Versant droit : quad 5-6-9-8
    { indices: [5, 6, 9, 8], nom: 'versant-droit' },
    // Pignon avant : pentagone 4-5-8 (triangle au-dessus des murs)
    // + rectangle 0-1-5-4 (murs, mais pas couvert par la bâche pignon)
    // Pour la bâche, le pignon = le pentagone 0-1-5-8-4 ou juste le triangle 4-5-8
    // En fait le pignon bâche couvre toute la face : du sol au faîtage
    { indices: [4, 5, 8], nom: 'pignon-avant' },
    // Pignon arrière : triangle 7-9-6
    { indices: [7, 9, 6], nom: 'pignon-arriere' },
  ];

  return { vertices, faces };
}
