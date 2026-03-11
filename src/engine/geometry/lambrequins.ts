import type { LambrequinParams, LambrequinPatronage, Panneau } from '../types';
import { decouperRectangle } from './slicing';
import { mm2versM2 } from './flatten';
import { arrondirML } from '@/lib/constants';

const OURLET_BAS_DEFAULT = 30;    // mm
const OURLET_LAT_DEFAULT = 30;    // mm

/**
 * Calcule si un lambrequin peut être découpé dans la chute du pignon.
 *
 * La chute disponible dans le coin du pignon s'évalue par la formule :
 *   largeur_inscrit = (largeur_base / 2) × (1 - hauteur_mm / h_eff)
 * avec h_eff = rampant - hauteur_murs (hauteur effective du triangle au-dessus des murs).
 *
 * Si largeur_inscrit >= longueur_lambrequin → PRIS EN CHUTE (0 ML supplémentaire).
 *
 * Exemple LDC 32 :
 *   demi_base=2215, rampant=3500, hauteur_murs=400, h_eff=3100
 *   lambrequin_droit : longueur=1300, hauteur=400
 *   largeur_inscrit = 2215 × (1 - 400/3100) = 1929mm ≥ 1300 → PRIS EN CHUTE ✓
 */
export function calculerOptimisationLambrequin(
  longueur_mm: number,
  hauteur_mm: number,
  largeur_base_mm: number,
  rampant_mm: number,
  hauteur_murs_mm: number,
): { pris_en_chute: boolean; largeur_disponible: number } {
  const demi_base = largeur_base_mm / 2;
  const h_eff = rampant_mm - hauteur_murs_mm;

  if (h_eff <= 0 || h_eff <= hauteur_mm) {
    return { pris_en_chute: false, largeur_disponible: 0 };
  }

  const largeur_disponible = Math.round(demi_base * (1 - hauteur_mm / h_eff));
  return {
    pris_en_chute: largeur_disponible >= longueur_mm,
    largeur_disponible,
  };
}

/**
 * Génère les patronages des lambrequins actifs pour une tente deux pans.
 * - Pris en chute : aucun panneau créé, ml_dedie = 0
 * - Panneau dédié : panneau rectangulaire (hauteur_totale × profondeur) ajouté au résultat
 */
export function calculerLambrequins(params: {
  lambrequin_gauche: LambrequinParams;
  lambrequin_droit: LambrequinParams;
  largeur_base_mm: number;
  profondeur_mm: number;
  rampant_gauche_mm: number;
  rampant_droit_mm: number;
  hauteur_murs_mm: number;
  laize_mm: number;
  recouvrement_mm: number;
}): LambrequinPatronage[] {
  const result: LambrequinPatronage[] = [];
  const rampant = Math.max(params.rampant_gauche_mm, params.rampant_droit_mm);

  const process = (lam: LambrequinParams, id: string, nom: string) => {
    if (!lam.actif || lam.hauteur_mm <= 0) return;

    const longueur = lam.longueur_mm > 0 ? lam.longueur_mm : params.profondeur_mm;
    const hauteur = lam.hauteur_mm;
    const ourlet_bas = lam.ourlet_bas_mm ?? OURLET_BAS_DEFAULT;
    const ourlet_lat = lam.ourlet_lateraux_mm ?? OURLET_LAT_DEFAULT;

    const { pris_en_chute, largeur_disponible } = calculerOptimisationLambrequin(
      longueur,
      hauteur,
      params.largeur_base_mm,
      rampant,
      params.hauteur_murs_mm,
    );

    if (pris_en_chute) {
      result.push({ id, nom, pris_en_chute: true, ml_dedie: 0, largeur_disponible });
    } else {
      // Panneau dédié : hauteur_totale (avec ourlets) dans le sens des laizes
      const hauteur_totale = hauteur + ourlet_bas + 2 * ourlet_lat;
      const bandes = decouperRectangle(
        id,
        hauteur_totale,
        longueur,
        params.laize_mm,
        params.recouvrement_mm,
      );
      const panneau: Panneau = {
        id,
        nom,
        vertices_2d: [
          [0, 0],
          [hauteur_totale, 0],
          [hauteur_totale, longueur],
          [0, longueur],
        ],
        surface_m2: mm2versM2(hauteur_totale * longueur),
        bandes,
      };
      const ml_dedie =
        Math.round(
          bandes.reduce((acc, b) => acc + arrondirML(b.longueur_mm), 0) * 100,
        ) / 100;
      result.push({ id, nom, pris_en_chute: false, ml_dedie, largeur_disponible: 0, panneau });
    }
  };

  process(params.lambrequin_gauche, 'lambrequin-gauche', 'Lambrequin gauche');
  process(params.lambrequin_droit, 'lambrequin-droit', 'Lambrequin droit');

  return result;
}
