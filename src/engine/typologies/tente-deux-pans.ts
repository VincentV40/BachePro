import type {
  TenteDeuxPansParams,
  Mesh3D,
  Panneau,
  ResultatPatronage,
  OptionsPatronage,
} from '../types';
import { genererMeshTenteDeuxPans } from '../geometry/mesh';
import { deplierVersant, deplierPignon } from '../geometry/flatten';
import { decouperRectangle } from '../geometry/slicing';
import { calculerNesting } from '../geometry/nesting';
import { calculerLambrequins } from '../geometry/lambrequins';
import { compterOeilletsTotaux } from '../geometry/oeillets';

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
  const marge_coupe_mm = options.marge_coupe_mm ?? 0;

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

  // Longueur de chaque bande = profondeur + ourlets + marges de coupe (aux deux bouts)
  const longueur_bande_versant = profondeur_mm + 2 * ourlet_mm + 2 * marge_coupe_mm;

  // Découper le développé en laizes
  const bandes_versant = decouperRectangle(
    'versant',
    versantDeplie.developpe_mm,
    longueur_bande_versant,
    laize_mm,
    recouvrement_mm,
  );

  // Formule décomposée pour affichage atelier
  const composants_versant: number[] = [];
  if (retombee_gauche > 0) composants_versant.push(retombee_gauche);
  composants_versant.push(rampant_gauche_mm, rampant_droit_mm);
  if (retombee_droite > 0) composants_versant.push(retombee_droite);
  const formule_versant = `(${composants_versant.join(' + ')}) = ${versantDeplie.developpe_mm} mm développé`;

  const versantPanel: Panneau = {
    id: 'versant',
    nom: 'Versant',
    vertices_2d: versantDeplie.vertices_2d,
    surface_m2: versantDeplie.surface_m2,
    bandes: bandes_versant,
    formule_calcul: formule_versant,
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
    // Longueur = rampant + marges de coupe (ourlet non ajouté : la découpe en forme fournit la marge)
    const longueur_bande_pignon_av = pignonAvDeplie.hauteur_coupe_mm + 2 * marge_coupe_mm;
    const bandes_pignon_av = decouperRectangle(
      'pignon-avant',
      largeur_base_mm,
      longueur_bande_pignon_av,
      laize_mm,
      recouvrement_mm,
    );

    const pignonAvPanel: Panneau = {
      id: 'pignon-avant',
      nom: 'Pignon avant',
      vertices_2d: pignonAvDeplie.vertices_2d,
      surface_m2: pignonAvDeplie.surface_m2,
      bandes: bandes_pignon_av,
      formule_calcul: `Larg. ${largeur_base_mm} mm — bandes verticales h=${Math.max(rampant_gauche_mm, rampant_droit_mm)} mm`,
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

    const longueur_bande_pignon_ar = pignonArDeplie.hauteur_coupe_mm + 2 * marge_coupe_mm;
    const bandes_pignon_ar = decouperRectangle(
      'pignon-arriere',
      largeur_base_mm,
      longueur_bande_pignon_ar,
      laize_mm,
      recouvrement_mm,
    );

    const pignonArPanel: Panneau = {
      id: 'pignon-arriere',
      nom: 'Pignon arrière',
      vertices_2d: pignonArDeplie.vertices_2d,
      surface_m2: pignonArDeplie.surface_m2,
      bandes: bandes_pignon_ar,
      formule_calcul: `Larg. ${largeur_base_mm} mm — bandes verticales h=${Math.max(rampant_gauche_mm, rampant_droit_mm)} mm`,
    };
    panneaux.push(pignonArPanel);
  }

  // ================================================================
  // 4. LAMBREQUINS (optimisation chute vs panneau dédié)
  // ================================================================

  const lambrequins = calculerLambrequins({
    lambrequin_gauche: params.lambrequin_gauche,
    lambrequin_droit: params.lambrequin_droit,
    largeur_base_mm,
    profondeur_mm,
    rampant_gauche_mm,
    rampant_droit_mm,
    hauteur_murs_mm: params.hauteur_murs_mm,
    laize_mm,
    recouvrement_mm,
  });

  // Ajouter les panneaux dédiés (lambrequins non récupérables en chute) au plan
  for (const lam of lambrequins) {
    if (!lam.pris_en_chute && lam.panneau) {
      panneaux.push(lam.panneau);
    }
  }

  // ================================================================
  // 5. CALCUL NESTING ET TOTAUX
  // ================================================================

  const nesting = calculerNesting(panneaux, laize_mm);

  // Surface totale = somme des surfaces de tous les panneaux
  const surface_totale_m2 = panneaux.reduce((acc, p) => acc + p.surface_m2, 0);

  // Œillets : compter sur tous les panneaux si config présente
  const nb_oeillets = params.oeillets_config
    ? compterOeilletsTotaux(panneaux, params.oeillets_config)
    : undefined;

  return {
    panneaux,
    ml_total: nesting.ml_total,
    nombre_laizes: nesting.nombre_laizes,
    taux_chute_pct: nesting.taux_chute_pct,
    surface_totale_m2: Math.round(surface_totale_m2 * 100) / 100,
    lambrequins,
    nb_oeillets,
  };
}
