import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  OURLET_MM,
  RECOUVREMENT_MM,
  TAUX_HORAIRE_CONFECTION,
  TAUX_HORAIRE_POSE,
  COUT_KM,
  OVERHEAD_PCT,
  TVA_TAUX,
  MARGE_DEFAUT_PCT,
} from '@/lib/constants';

interface ParametresState {
  ourlet_mm: number;
  recouvrement_mm: number;
  taux_horaire_confection: number;
  taux_horaire_pose: number;
  cout_km: number;
  overhead_pct: number;
  tva_taux: number;
  marge_defaut_pct: number;
  setParametre: <K extends keyof ParametresState>(key: K, value: ParametresState[K]) => void;
}

export const useParametresStore = create<ParametresState>()(
  persist(
    (set) => ({
      ourlet_mm: OURLET_MM,
      recouvrement_mm: RECOUVREMENT_MM,
      taux_horaire_confection: TAUX_HORAIRE_CONFECTION,
      taux_horaire_pose: TAUX_HORAIRE_POSE,
      cout_km: COUT_KM,
      overhead_pct: OVERHEAD_PCT,
      tva_taux: TVA_TAUX,
      marge_defaut_pct: MARGE_DEFAUT_PCT,

      setParametre: (key, value) => set({ [key]: value }),
    }),
    { name: 'bache-pro-parametres' },
  ),
);
