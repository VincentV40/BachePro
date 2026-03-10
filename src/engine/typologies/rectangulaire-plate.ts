import { v4 as uuidv4 } from 'uuid';
import type {
  RectangulairePlateParams,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
  Mesh3D,
  Point3D,
} from '../types';
import { decouperRectangle } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { mm2versM2 } from '../geometry/flatten';

/**
 * Rectangulaire plate : un simple rectangle plat (bache tendue horizontale).
 * C'est la topologie la plus simple.
 */

export function genererGeometrie(params: RectangulairePlateParams): Mesh3D {
  const { largeur_mm, profondeur_mm } = params;
  const hw = largeur_mm / 2;
  const hd = profondeur_mm / 2;
  const vertices: Point3D[] = [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [hw, 0, hd],
    [-hw, 0, hd],
  ];
  return {
    vertices,
    faces: [{ indices: [0, 1, 2, 3], nom: 'plan' }],
  };
}

export function genererPanneaux(
  params: RectangulairePlateParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_mm, profondeur_mm } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  // Un seul panneau rectangulaire
  // Bandes couvrent la largeur, longueur = profondeur + ourlets
  const longueur_bande = profondeur_mm + 2 * ourlet_mm;
  const bandes = decouperRectangle('plan', largeur_mm, longueur_bande, laize_mm, recouvrement_mm);

  const surface_mm2 = largeur_mm * profondeur_mm;
  const panneau: Panneau = {
    id: 'plan',
    nom: 'Plan rectangulaire',
    vertices_2d: [[0, 0], [largeur_mm, 0], [largeur_mm, profondeur_mm], [0, profondeur_mm]],
    surface_m2: mm2versM2(surface_mm2),
    bandes,
  };

  const nesting = calculerNesting([panneau], laize_mm);

  return {
    panneaux: [panneau],
    ml_total: nesting.ml_total,
    nombre_laizes: nesting.nombre_laizes,
    taux_chute_pct: nesting.taux_chute_pct,
    surface_totale_m2: panneau.surface_m2,
  };
}
