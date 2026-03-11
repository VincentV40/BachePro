// ============================================================
// Constantes par défaut — valeurs provisoires à recalibrer
// avec les données réelles de l'atelier Stores Dublanc
// ============================================================

/** Ourlet par bout de bande, en mm (ajouté à chaque extrémité de la profondeur) */
export const OURLET_MM = 100;

/** Recouvrement entre deux bandes pour soudure haute fréquence, en mm */
export const RECOUVREMENT_MM = 40;

/** Marge de coupe par extrémité de bande, en mm (marge de sécurité pour la découpe) */
export const MARGE_COUPE_MM = 50;

/** Arrondi du métrage linéaire : au décimètre supérieur (100mm = 0.1 ML) */
export const ARRONDI_ML_MM = 100;

/**
 * Arrondit une longueur en mm au décimètre supérieur et retourne en mètres linéaires.
 * Ex: 13 750 mm → 13 800 mm → 13.80 ML
 */
export function arrondirML(longueur_mm: number): number {
  const arrondi_mm = Math.ceil(longueur_mm / ARRONDI_ML_MM) * ARRONDI_ML_MM;
  return arrondi_mm / 1000;
}

// --- Chiffrage ---

/** Taux horaire main d'œuvre confection (€/h HT) */
export const TAUX_HORAIRE_CONFECTION = 45;

/** Taux horaire main d'œuvre pose (€/h HT) */
export const TAUX_HORAIRE_POSE = 50;

/** Coût kilométrique déplacement (€/km) */
export const COUT_KM = 0.65;

/** Overhead / frais généraux (% du coût direct) */
export const OVERHEAD_PCT = 15;

/** Taux TVA standard */
export const TVA_TAUX = 20;

/** Marge par défaut (%) */
export const MARGE_DEFAUT_PCT = 35;
