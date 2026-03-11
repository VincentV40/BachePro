import type {
  MonoPenteParams,
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
 * Mono-pente : une seule pente (comme un appentis / auvent).
 * Le tissu couvre la pente + eventuellement une retombee cote haut et cote bas.
 */

export function genererGeometrie(params: MonoPenteParams): Mesh3D {
  const { largeur_mm, profondeur_mm, rampant_mm, hauteur_haute_mm, hauteur_basse_mm } = params;
  const hw = largeur_mm / 2;
  const vertices: Point3D[] = [
    [-hw, 0, 0],                   // Bas gauche sol
    [hw, 0, 0],                    // Bas droit sol
    [hw, 0, profondeur_mm],        // Bas gauche sol arriere
    [-hw, 0, profondeur_mm],       // Bas droit sol arriere
    [-hw, hauteur_haute_mm, 0],    // Haut avant gauche
    [hw, hauteur_haute_mm, 0],     // Haut avant droit
    [hw, hauteur_basse_mm, profondeur_mm],  // Haut arriere droit
    [-hw, hauteur_basse_mm, profondeur_mm], // Haut arriere gauche
  ];
  return {
    vertices,
    faces: [
      { indices: [4, 5, 6, 7], nom: 'versant' },
    ],
  };
}

export function genererPanneaux(
  params: MonoPenteParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_mm, profondeur_mm, rampant_mm } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  // Versant = rectangle : developpe = rampant, longueur bande = largeur + ourlets
  // Les bandes couvrent le rampant, alignees sur la largeur
  const longueur_bande = largeur_mm + 2 * ourlet_mm;
  const bandes = decouperRectangle('versant', rampant_mm, longueur_bande, laize_mm, recouvrement_mm);

  const surface_mm2 = rampant_mm * largeur_mm;
  const panneau: Panneau = {
    id: 'versant',
    nom: 'Versant mono-pente',
    vertices_2d: [[0, 0], [rampant_mm, 0], [rampant_mm, largeur_mm], [0, largeur_mm]],
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
