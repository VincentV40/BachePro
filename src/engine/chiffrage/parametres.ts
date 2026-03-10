/**
 * Paramètres par défaut du chiffrage.
 * Ces valeurs sont surchargées par le store parametres-store.
 */

/** Surface (m²) au-dessus de laquelle on estime un temps de confection plus long */
export const SEUIL_SURFACE_COMPLEXE_M2 = 50;

/** Temps de confection estimé par m² de surface (heures) */
export const HEURES_CONFECTION_PAR_M2 = 0.15;

/** Temps minimum de confection (heures) */
export const HEURES_CONFECTION_MIN = 2;

/** Temps de pose estimé par m² (heures, par poseur) */
export const HEURES_POSE_PAR_M2 = 0.08;

/** Temps minimum de pose (heures) */
export const HEURES_POSE_MIN = 2;

/** Nombre de poseurs par défaut */
export const NB_POSEURS_DEFAUT = 2;
