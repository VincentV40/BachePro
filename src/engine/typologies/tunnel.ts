import type {
  TunnelParams,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
  Mesh3D,
  Point3D,
  Point2D,
} from '../types';
import { decouperRectangle } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { mm2versM2 } from '../geometry/flatten';

/**
 * Tunnel : demi-cylindre. La bache couvre un arc de cercle.
 * Approche : on approxime le demi-cercle par N facettes planes,
 * puis on deplie chaque facette comme un rectangle etroit.
 * En pratique, la bache est UNE piece continue sur tout l'arc.
 */

export function genererGeometrie(params: TunnelParams): Mesh3D {
  const { largeur_mm, profondeur_mm, hauteur_mm, nb_facettes } = params;
  const n = nb_facettes || 8;
  const radius = largeur_mm / 2;
  const vertices: Point3D[] = [];

  // Generer les points de l'arc (demi-cercle) a z=0 et z=profondeur
  for (let z = 0; z <= 1; z++) {
    const zPos = z * profondeur_mm;
    for (let i = 0; i <= n; i++) {
      const angle = Math.PI * i / n; // de 0 (droite) a PI (gauche)
      const x = radius * Math.cos(angle);
      const y = hauteur_mm * Math.sin(angle);
      vertices.push([x, y, zPos]);
    }
  }

  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = i;
    const b = i + 1;
    const c = (n + 1) + i + 1;
    const d = (n + 1) + i;
    faces.push({ indices: [a, b, c, d], nom: `facette-${i}` });
  }

  return { vertices, faces };
}

export function genererPanneaux(
  params: TunnelParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const { largeur_mm, profondeur_mm, hauteur_mm, nb_facettes } = params;
  const { laize_mm, ourlet_mm, recouvrement_mm } = options;
  const n = nb_facettes || 8;

  // Calculer le developpe de l'arc = somme des cordes des facettes
  const radius = largeur_mm / 2;
  let developpe = 0;
  for (let i = 0; i < n; i++) {
    const a1 = Math.PI * i / n;
    const a2 = Math.PI * (i + 1) / n;
    const x1 = radius * Math.cos(a1);
    const y1 = hauteur_mm * Math.sin(a1);
    const x2 = radius * Math.cos(a2);
    const y2 = hauteur_mm * Math.sin(a2);
    developpe += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // Le tunnel est UNE piece continue : developpe x profondeur
  const longueur_bande = profondeur_mm + 2 * ourlet_mm;
  const bandes = decouperRectangle('tunnel', developpe, longueur_bande, laize_mm, recouvrement_mm);

  const surface_mm2 = developpe * profondeur_mm;
  const panneau: Panneau = {
    id: 'tunnel',
    nom: 'Tunnel (arc deplie)',
    vertices_2d: [[0, 0], [developpe, 0], [developpe, profondeur_mm], [0, profondeur_mm]],
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
