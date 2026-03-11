import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  OURLET_MM,
  RECOUVREMENT_MM,
  MARGE_COUPE_MM,
  TAUX_HORAIRE_CONFECTION,
  TAUX_HORAIRE_POSE,
  COUT_KM,
  OVERHEAD_PCT,
  TVA_TAUX,
  MARGE_DEFAUT_PCT,
} from '@/lib/constants';

export interface EntrepriseInfo {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  siret: string;
  tel: string;
  email: string;
  site: string;
}

interface ParametresState {
  // Confection
  ourlet_mm: number;
  recouvrement_mm: number;
  marge_coupe_mm: number;
  // Taux horaires
  taux_horaire_confection: number;
  taux_horaire_pose: number;
  nb_poseurs_defaut: number;
  // Déplacement
  cout_km: number;
  // Finances
  overhead_pct: number;
  tva_taux: number;
  marge_defaut_pct: number;
  // Entreprise
  entreprise: EntrepriseInfo;
  setParametre: <K extends keyof Omit<ParametresState, 'setParametre' | 'setEntreprise'>>(
    key: K,
    value: ParametresState[K],
  ) => void;
  setEntreprise: (info: Partial<EntrepriseInfo>) => void;
}

export const useParametresStore = create<ParametresState>()(
  persist(
    (set) => ({
      ourlet_mm: OURLET_MM,
      recouvrement_mm: RECOUVREMENT_MM,
      marge_coupe_mm: MARGE_COUPE_MM,
      taux_horaire_confection: TAUX_HORAIRE_CONFECTION,
      taux_horaire_pose: TAUX_HORAIRE_POSE,
      nb_poseurs_defaut: 2,
      cout_km: COUT_KM,
      overhead_pct: OVERHEAD_PCT,
      tva_taux: TVA_TAUX,
      marge_defaut_pct: MARGE_DEFAUT_PCT,
      entreprise: {
        nom: 'ALS Confort — Stores Dublanc',
        adresse: '1 rue des Artisans',
        code_postal: '40800',
        ville: 'Aire-sur-l\'Adour',
        siret: '',
        tel: '',
        email: '',
        site: '',
      },

      setParametre: (key, value) => set({ [key]: value }),
      setEntreprise: (info) =>
        set((state) => ({ entreprise: { ...state.entreprise, ...info } })),
    }),
    { name: 'bache-pro-parametres' },
  ),
);
