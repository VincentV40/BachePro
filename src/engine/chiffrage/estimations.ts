import {
  HEURES_CONFECTION_PAR_M2,
  HEURES_CONFECTION_MIN,
  HEURES_POSE_PAR_M2,
  HEURES_POSE_MIN,
  NB_POSEURS_DEFAUT,
} from './parametres';

/**
 * Estime le temps de confection en heures selon la surface totale.
 */
export function estimerHeuresConfection(surface_m2: number): number {
  const heures = Math.max(HEURES_CONFECTION_MIN, surface_m2 * HEURES_CONFECTION_PAR_M2);
  return Math.round(heures * 10) / 10; // Arrondi au dixième
}

/**
 * Estime le temps de pose en heures selon la surface totale.
 */
export function estimerHeuresPose(surface_m2: number): number {
  const heures = Math.max(HEURES_POSE_MIN, surface_m2 * HEURES_POSE_PAR_M2);
  return Math.round(heures * 10) / 10;
}

/** Nombre de poseurs par défaut */
export const nbPoseursDefaut = NB_POSEURS_DEFAUT;
