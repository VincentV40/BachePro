import type {
  FormeLibreParams,
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
 * Forme libre : polygone quelconque defini par l'utilisateur.
 * On calcule le bounding box pour le decoupage en laizes,
 * puis on utilise la surface reelle du polygone pour le chiffrage.
 */

export function genererGeometrie(params: FormeLibreParams): Mesh3D {
  const { vertices, profondeur_mm } = params;
  const pts3d: Point3D[] = [];

  // Face du bas (y=0)
  for (const [x, z] of vertices) {
    pts3d.push([x, 0, z]);
  }

  // Face du haut (y=profondeur_mm) si profondeur > 0
  if (profondeur_mm > 0) {
    for (const [x, z] of vertices) {
      pts3d.push([x, profondeur_mm, z]);
    }
  }

  const n = vertices.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  return {
    vertices: pts3d,
    faces: [{ indices, nom: 'forme-libre' }],
  };
}

export function genererPanneaux(
  params: FormeLibreParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { vertices } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  if (vertices.length < 3) {
    return {
      panneaux: [],
      ml_total: 0,
      nombre_laizes: 0,
      taux_chute_pct: 0,
      surface_totale_m2: 0,
    };
  }

  // Bounding box du polygone
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of vertices) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const largeur_bbox = maxX - minX;
  const hauteur_bbox = maxY - minY;

  // Decouper sur le bounding box (conservatif)
  const longueur_bande = hauteur_bbox + 2 * ourlet_mm;
  const bandes = decouperRectangle('forme-libre', largeur_bbox, longueur_bande, laize_mm, recouvrement_mm);

  const surface_mm2 = surfacePolygone(vertices);
  const vertices_2d: Point2D[] = vertices.map(([x, y]) => [x - minX, y - minY]);

  const panneau: Panneau = {
    id: 'forme-libre',
    nom: 'Forme libre',
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
