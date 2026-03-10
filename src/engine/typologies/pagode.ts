import type {
  PagodeParams,
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
 * Pagode : structure a 4 pans avec un sommet central plus eleve.
 * Forme typique des tentes de reception carrees/rectangulaires.
 * 4 panneaux triangulaires (ou trapezoidaux si on inclut les retombees).
 */

export function genererGeometrie(params: PagodeParams): Mesh3D {
  const { largeur_mm, profondeur_mm, hauteur_faitage_mm, hauteur_bords_mm } = params;
  const hw = largeur_mm / 2;
  const hd = profondeur_mm / 2;

  const vertices: Point3D[] = [
    // Coins bas (hauteur bords)
    [-hw, hauteur_bords_mm, -hd],  // 0 avant gauche
    [hw, hauteur_bords_mm, -hd],   // 1 avant droit
    [hw, hauteur_bords_mm, hd],    // 2 arriere droit
    [-hw, hauteur_bords_mm, hd],   // 3 arriere gauche
    // Sommet central
    [0, hauteur_faitage_mm, 0],     // 4
  ];

  return {
    vertices,
    faces: [
      { indices: [0, 1, 4], nom: 'pan-avant' },
      { indices: [1, 2, 4], nom: 'pan-droit' },
      { indices: [2, 3, 4], nom: 'pan-arriere' },
      { indices: [3, 0, 4], nom: 'pan-gauche' },
    ],
  };
}

export function genererPanneaux(
  params: PagodeParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_mm, profondeur_mm, rampant_mm } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  const panneaux: Panneau[] = [];

  // Pan avant et arriere : base = largeur, hauteur = rampant
  for (const nom of ['Pan avant', 'Pan arriere'] as const) {
    const id = nom.toLowerCase().replace(/\s+/g, '-');
    const longueur_bande = rampant_mm; // Pas d'ourlet sur pans pagode (comme pignons)
    const bandes = decouperRectangle(id, largeur_mm, longueur_bande, laize_mm, recouvrement_mm);
    const surface_mm2 = (largeur_mm * rampant_mm) / 2;

    panneaux.push({
      id,
      nom,
      vertices_2d: [[0, 0], [largeur_mm, 0], [largeur_mm / 2, rampant_mm]],
      surface_m2: mm2versM2(surface_mm2),
      bandes,
    });
  }

  // Pan gauche et droit : base = profondeur, hauteur = rampant
  for (const nom of ['Pan droit', 'Pan gauche'] as const) {
    const id = nom.toLowerCase().replace(/\s+/g, '-');
    const longueur_bande = rampant_mm;
    const bandes = decouperRectangle(id, profondeur_mm, longueur_bande, laize_mm, recouvrement_mm);
    const surface_mm2 = (profondeur_mm * rampant_mm) / 2;

    panneaux.push({
      id,
      nom,
      vertices_2d: [[0, 0], [profondeur_mm, 0], [profondeur_mm / 2, rampant_mm]],
      surface_m2: mm2versM2(surface_mm2),
      bandes,
    });
  }

  const nesting = calculerNesting(panneaux, laize_mm);
  const surface_totale_m2 = panneaux.reduce((acc, p) => acc + p.surface_m2, 0);

  return {
    panneaux,
    ml_total: nesting.ml_total,
    nombre_laizes: nesting.nombre_laizes,
    taux_chute_pct: nesting.taux_chute_pct,
    surface_totale_m2: Math.round(surface_totale_m2 * 100) / 100,
  };
}
