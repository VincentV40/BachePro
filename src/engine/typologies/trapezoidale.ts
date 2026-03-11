import type {
  TrapezoidaleParams,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
  Mesh3D,
  Point3D,
  Point2D,
} from '../types';
import { decouperRectangle } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { mm2versM2, surfacePolygone } from '../geometry/flatten';
import { compterOeilletsTotaux } from '../geometry/oeillets';

/**
 * Trapezoidale : une bache en forme de trapeze (vue de dessus).
 * Largeur avant != largeur arriere.
 * Le rampant definit la longueur de pente.
 */

export function genererGeometrie(params: TrapezoidaleParams): Mesh3D {
  const { largeur_avant_mm, largeur_arriere_mm, profondeur_mm, rampant_mm } = params;
  const ha = largeur_avant_mm / 2;
  const hb = largeur_arriere_mm / 2;
  const vertices: Point3D[] = [
    [-ha, 0, 0],
    [ha, 0, 0],
    [hb, 0, profondeur_mm],
    [-hb, 0, profondeur_mm],
  ];
  return {
    vertices,
    faces: [{ indices: [0, 1, 2, 3], nom: 'plan-trapeze' }],
  };
}

export function genererPanneaux(
  params: TrapezoidaleParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_avant_mm, largeur_arriere_mm, profondeur_mm, rampant_mm } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  // Le trapeze est deplie a plat
  // Largeur max = max(avant, arriere)
  // Longueur bande = rampant + ourlets
  const largeur_max = Math.max(largeur_avant_mm, largeur_arriere_mm);
  const longueur_bande = rampant_mm + 2 * ourlet_mm;

  // On decoupe sur la largeur max (conservatif — on ajuste ensuite en forme)
  const bandes = decouperRectangle('plan-trapeze', largeur_max, longueur_bande, laize_mm, recouvrement_mm);

  const vertices_2d: Point2D[] = [
    [0, 0],
    [largeur_avant_mm, 0],
    [largeur_arriere_mm, profondeur_mm],
    [0, profondeur_mm],
  ];
  const surface_mm2 = surfacePolygone(vertices_2d);

  const panneau: Panneau = {
    id: 'plan-trapeze',
    nom: 'Plan trapezoidale',
    vertices_2d,
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
