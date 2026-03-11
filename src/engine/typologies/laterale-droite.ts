import type {
  LateraleDroiteParams,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
  Mesh3D,
  Point3D,
} from '../types';
import { decouperRectangle } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { mm2versM2 } from '../geometry/flatten';
import { compterOeilletsTotaux } from '../geometry/oeillets';

/**
 * Laterale droite : un panneau vertical rectangulaire (facade, rideau lateral).
 */

export function genererGeometrie(params: LateraleDroiteParams): Mesh3D {
  const { largeur_mm, hauteur_mm, profondeur_mm } = params;
  const hw = largeur_mm / 2;
  const vertices: Point3D[] = [
    [-hw, 0, 0],
    [hw, 0, 0],
    [hw, hauteur_mm, 0],
    [-hw, hauteur_mm, 0],
  ];
  return {
    vertices,
    faces: [{ indices: [0, 1, 2, 3], nom: 'laterale' }],
  };
}

export function genererPanneaux(
  params: LateraleDroiteParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_mm, hauteur_mm } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  // Panneau rectangulaire : bandes couvrent la largeur, longueur = hauteur + ourlets
  const longueur_bande = hauteur_mm + 2 * ourlet_mm;
  const bandes = decouperRectangle('laterale', largeur_mm, longueur_bande, laize_mm, recouvrement_mm);

  const surface_mm2 = largeur_mm * hauteur_mm;
  const panneau: Panneau = {
    id: 'laterale',
    nom: 'Laterale droite',
    vertices_2d: [[0, 0], [largeur_mm, 0], [largeur_mm, hauteur_mm], [0, hauteur_mm]],
    surface_m2: mm2versM2(surface_mm2),
    bandes,
  };

  const nesting = calculerNesting([panneau], laize_mm);
  const nb_oeillets = params.oeillets_config
    ? compterOeilletsTotaux([panneau], params.oeillets_config)
    : undefined;

  return {
    panneaux: [panneau],
    ml_total: nesting.ml_total,
    nombre_laizes: nesting.nombre_laizes,
    taux_chute_pct: nesting.taux_chute_pct,
    surface_totale_m2: panneau.surface_m2,
    nb_oeillets,
  };
}
