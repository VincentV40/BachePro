import type { Bande, Panneau } from '../types';
import { arrondirML } from '@/lib/constants';

/**
 * Calcul du nesting V1 : placement séquentiel simple.
 *
 * Toutes les bandes sont placées bout à bout sur le rouleau.
 * Pas d'optimisation tête-bêche en V1.
 *
 * @param panneaux - Tous les panneaux avec leurs bandes
 * @param laize_mm - Largeur du rouleau
 * @returns ML total et taux de chute
 */
export function calculerNesting(
  panneaux: Panneau[],
  laize_mm: number,
): { ml_total: number; taux_chute_pct: number; nombre_laizes: number } {
  let ml_total = 0;
  let surface_utile_mm2 = 0;
  let nombre_laizes = 0;

  for (const panneau of panneaux) {
    for (const bande of panneau.bandes) {
      const ml_bande = arrondirML(bande.longueur_mm);
      ml_total += ml_bande;
      nombre_laizes++;

      // Surface utile = largeur effective × longueur réelle (avant arrondi)
      surface_utile_mm2 += bande.largeur_effective_mm * bande.longueur_mm;
    }
  }

  // Arrondir le total à 2 décimales
  ml_total = Math.round(ml_total * 100) / 100;

  // Surface totale consommée = ML total (en mm) × laize
  const surface_totale_mm2 = ml_total * 1000 * laize_mm;

  // Taux de chute
  const taux_chute_pct = surface_totale_mm2 > 0
    ? Math.round((1 - surface_utile_mm2 / surface_totale_mm2) * 10000) / 100
    : 0;

  return { ml_total, taux_chute_pct, nombre_laizes };
}
