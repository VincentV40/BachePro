import type { Chiffrage, ResultatPatronage, Tissu } from '../types';
import { estimerHeuresConfection, estimerHeuresPose, nbPoseursDefaut } from './estimations';
import {
  TAUX_HORAIRE_CONFECTION,
  TAUX_HORAIRE_POSE,
  COUT_KM,
  OVERHEAD_PCT,
  TVA_TAUX,
  MARGE_DEFAUT_PCT,
} from '@/lib/constants';

interface ChiffrageOptions {
  // Overrides manuels (si l'utilisateur modifie les estimations auto)
  heures_confection?: number;
  heures_pose?: number;
  nb_poseurs?: number;
  km_deplacement?: number;
  sous_traitance?: number;
  marge_pct?: number;
  fournitures?: { description: string; quantite: number; prix_unitaire: number }[];
  taux_horaire_confection?: number;
  taux_horaire_pose?: number;
  cout_km?: number;
  overhead_pct?: number;
  tva_taux?: number;
}

/**
 * Calcule le chiffrage complet d'un projet.
 */
export function calculerChiffrage(
  resultat: ResultatPatronage,
  tissu: Tissu,
  options: ChiffrageOptions = {},
): Chiffrage {
  // Matière
  const tissu_ml = resultat.ml_total;
  const prix_ml = tissu.prix_ml_ht;
  const matiere_total = Math.round(tissu_ml * prix_ml * 100) / 100;

  // Fournitures
  const fournitures = (options.fournitures ?? []).map((f) => ({
    ...f,
    total: Math.round(f.quantite * f.prix_unitaire * 100) / 100,
  }));
  const fournitures_total = fournitures.reduce((acc, f) => acc + f.total, 0);

  // MO confection
  const tauxConf = options.taux_horaire_confection ?? TAUX_HORAIRE_CONFECTION;
  const heuresConf = options.heures_confection ?? estimerHeuresConfection(resultat.surface_totale_m2);
  const confection_total = Math.round(heuresConf * tauxConf * 100) / 100;

  // MO pose
  const tauxPose = options.taux_horaire_pose ?? TAUX_HORAIRE_POSE;
  const nbPoseurs = options.nb_poseurs ?? nbPoseursDefaut;
  const heuresPose = options.heures_pose ?? estimerHeuresPose(resultat.surface_totale_m2);
  const pose_total = Math.round(heuresPose * nbPoseurs * tauxPose * 100) / 100;

  // Déplacement
  const km = options.km_deplacement ?? 0;
  const coutKm = options.cout_km ?? COUT_KM;
  const deplacement_total = Math.round(km * coutKm * 100) / 100;

  // Sous-traitance
  const sous_traitance = options.sous_traitance ?? 0;

  // Overhead
  const overheadPct = options.overhead_pct ?? OVERHEAD_PCT;
  const cout_direct = matiere_total + fournitures_total + confection_total + pose_total + deplacement_total + sous_traitance;
  const overhead_montant = Math.round(cout_direct * overheadPct / 100 * 100) / 100;

  // Coût de revient
  const cout_revient_ht = Math.round((cout_direct + overhead_montant) * 100) / 100;

  // Marge et prix de vente
  const marge_pct = options.marge_pct ?? MARGE_DEFAUT_PCT;
  const prix_vente_ht = Math.round(cout_revient_ht / (1 - marge_pct / 100) * 100) / 100;

  // TVA
  const tva_taux = options.tva_taux ?? TVA_TAUX;
  const prix_vente_ttc = Math.round(prix_vente_ht * (1 + tva_taux / 100) * 100) / 100;

  return {
    matiere: { tissu_ml, prix_ml, total: matiere_total },
    fournitures,
    mo_confection: {
      heures: heuresConf,
      taux: tauxConf,
      total: confection_total,
      auto_estime: options.heures_confection === undefined,
    },
    mo_pose: {
      heures: heuresPose,
      nb_poseurs: nbPoseurs,
      taux: tauxPose,
      total: pose_total,
      auto_estime: options.heures_pose === undefined,
    },
    deplacement: { km, cout_km: coutKm, total: deplacement_total },
    sous_traitance,
    overhead_pct: overheadPct,
    overhead_montant,
    cout_revient_ht,
    marge_pct,
    prix_vente_ht,
    tva_taux,
    prix_vente_ttc,
  };
}
