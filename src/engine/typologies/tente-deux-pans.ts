import { v4 as uuidv4 } from 'uuid';
import type {
  TenteDeuxPansParams,
  Mesh3D,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
} from '../types';
import { genererMeshTenteDeuxPans } from '../geometry/mesh';
import { deplierVersant, deplierPignon } from '../geometry/flatten';
import { decouperRectangle, decouperPolygone } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { OURLET_MM, RECOUVREMENT_MM } from '@/lib/constants';

/**
 * Génère la géométrie 3D d'une tente deux pans.
 */
export function genererGeometrie(params: TenteDeuxPansParams): Mesh3D {
  return genererMeshTenteDeuxPans(params);
}

/**
 * Génère le patronage complet : panneaux dépliés, bandes découpées, ML total.
 *
 * Modèle de calcul validé sur LDC 32 :
 * - Versant = 1 pièce continue par-dessus le faîtage
 *   développé = retombée_gauche + rampant_gauche + rampant_droit + retombée_droite
 *   longueur_bande = profondeur + 2 × ourlet
 * - Pignons = triangles, bandes verticales, longueur = rampant
 *
 * @param params - Paramètres de la tente
 * @param options - Options de patronage (laize, ourlet, recouvrement)
 * @returns Résultat complet du patronage
 */
export function genererPanneaux(
  params: TenteDeuxPansParams,
  options: OptionsPatronage,
): ResultatPatronage {
  const {
    largeur_base_mm,
    profondeur_mm,
    rampant_gauche_mm,
    rampant_droit_mm,
    lambrequin_gauche,
    lambrequin_droit,
    pignon_avant,
    pignon_arriere,
  } = params;

  const { laize_mm, ourlet_mm, recouvrement_mm } = options;

  const panneaux: Panneau[] = [];

  // ================================================================
  // 1. VERSANT — pièce continue par-dessus le faîtage
  // ================================================================

  // Retombées = hauteur du lambrequin si actif, sinon 0
  const retombee_gauche = lambrequin_gauche.actif ? lambrequin_gauche.hauteur_mm : 0;
  const retombee_droite = lambrequin_droit.actif ? lambrequin_droit.hauteur_mm : 0;

  const versantDeplie = deplierVersant(
    retombee_gauche,
    rampant_gauche_mm,
    rampant_droit_mm,
    retombee_droite,
    profondeur_mm,
  );

  // Longueur de chaque bande = profondeur + ourlets aux deux bouts
  const longueur_bande_versant = profondeur_mm + 2 * ourlet_mm;

  // Découper le développé en laizes
  const bandes_versant = decouperRectangle(
    'versant',
    versantDeplie.developpe_mm,
    longueur_bande_versant,
    laize_mm,
    recouvrement_mm,
  );

  const versantPanel: Panneau = {
    id: 'versant',
    nom: 'Versant',
    vertices_2d: versantDeplie.vertices_2d,
    surface_m2: versantDeplie.surface_m2,
    bandes: bandes_versant,
  };
  panneaux.push(versantPanel);

  // ================================================================
  // 2. PIGNON AVANT
  // ================================================================

  if (pignon_avant) {
    const pignonAvDeplie = deplierPignon(
      largeur_base_mm,
      Math.max(rampant_gauche_mm, rampant_droit_mm),
    );

    // Pour les pignons, les bandes sont verticales (laize couvre la largeur)
    // Longueur de chaque bande = rampant (hauteur de coupe)
    // Pas d'ourlet ajouté à la longueur pignon (la découpe en forme fournit la marge)
    const bandes_pignon_av = decouperRectangle(
      'pignon-avant',
      largeur_base_mm,
      pignonAvDeplie.hauteur_coupe_mm,
      laize_mm,
      recouvrement_mm,
    );

    const pignonAvPanel: Panneau = {
      id: 'pignon-avant',
      nom: 'Pignon avant',
      vertices_2d: pignonAvDeplie.vertices_2d,
      surface_m2: pignonAvDeplie.surface_m2,
      bandes: bandes_pignon_av,
    };
    panneaux.push(pignonAvPanel);
  }

  // ================================================================
  // 3. PIGNON ARRIÈRE
  // ================================================================

  if (pignon_arriere) {
    const pignonArDeplie = deplierPignon(
      largeur_base_mm,
      Math.max(rampant_gauche_mm, rampant_droit_mm),
    );

    const bandes_pignon_ar = decouperRectangle(
      'pignon-arriere',
      largeur_base_mm,
      pignonArDeplie.hauteur_coupe_mm,
      laize_mm,
      recouvrement_mm,
    );

    const pignonArPanel: Panneau = {
      id: 'pignon-arriere',
      nom: 'Pignon arrière',
      vertices_2d: pignonArDeplie.vertices_2d,
      surface_m2: pignonArDeplie.surface_m2,
      bandes: bandes_pignon_ar,
    };
    panneaux.push(pignonArPanel);
  }

  // ================================================================
  // 4. CALCUL NESTING ET TOTAUX
  // ================================================================

  const nesting = calculerNesting(panneaux, laize_mm);

  // Surface totale = somme des surfaces de tous les panneaux
  const surface_totale_m2 = panneaux.reduce((acc, p) => acc + p.surface_m2, 0);

  return {
    panneaux,
    ml_total: nesting.ml_total,
    nombre_laizes: nesting.nombre_laizes,
    taux_chute_pct: nesting.taux_chute_pct,
    surface_totale_m2: Math.round(surface_totale_m2 * 100) / 100,
  };
}
