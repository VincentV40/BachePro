import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Projet,
  TypologieBache,
  TenteDeuxPansParams,
  MonoPenteParams,
  RectangulairePlateParams,
  TrapezoidaleParams,
  PagodeParams,
  TunnelParams,
  LateraleDroiteParams,
  FormeLibreParams,
  ResultatPatronage,
  Chiffrage,
} from '@/engine/types';

const defaultTenteDeuxPans: TenteDeuxPansParams = {
  largeur_base_mm: 4000,
  profondeur_mm: 10000,
  rampant_gauche_mm: 3000,
  rampant_droit_mm: 3000,
  hauteur_murs_mm: 300,
  lambrequin_gauche: { actif: false, longueur_mm: 0, hauteur_mm: 0 },
  lambrequin_droit: { actif: false, longueur_mm: 0, hauteur_mm: 0 },
  pignon_avant: true,
  pignon_arriere: true,
};

const defaultMonoPente: MonoPenteParams = {
  largeur_mm: 4000,
  profondeur_mm: 6000,
  rampant_mm: 3000,
  hauteur_haute_mm: 3000,
  hauteur_basse_mm: 2200,
};

const defaultRectangulairePlate: RectangulairePlateParams = {
  largeur_mm: 5000,
  profondeur_mm: 8000,
};

const defaultTrapezoidale: TrapezoidaleParams = {
  largeur_avant_mm: 5000,
  largeur_arriere_mm: 3000,
  profondeur_mm: 6000,
  rampant_mm: 3500,
};

const defaultPagode: PagodeParams = {
  largeur_mm: 5000,
  profondeur_mm: 5000,
  hauteur_faitage_mm: 4000,
  hauteur_bords_mm: 2500,
  rampant_mm: 3000,
};

const defaultTunnel: TunnelParams = {
  largeur_mm: 6000,
  profondeur_mm: 10000,
  hauteur_mm: 3000,
  nb_facettes: 8,
};

const defaultLateraleDroite: LateraleDroiteParams = {
  largeur_mm: 6000,
  hauteur_mm: 3000,
  profondeur_mm: 0,
};

const defaultFormeLibre: FormeLibreParams = {
  vertices: [[0, 0], [3000, 0], [3000, 2000], [0, 2000]],
  profondeur_mm: 0,
};

function getDefaultParams(typologie: TypologieBache): Projet['params'] {
  switch (typologie) {
    case 'tente-deux-pans': return defaultTenteDeuxPans;
    case 'mono-pente': return defaultMonoPente;
    case 'rectangulaire-plate': return defaultRectangulairePlate;
    case 'trapezoidale': return defaultTrapezoidale;
    case 'pagode': return defaultPagode;
    case 'tunnel': return defaultTunnel;
    case 'laterale-droite': return defaultLateraleDroite;
    case 'forme-libre': return defaultFormeLibre;
    default: return defaultRectangulairePlate;
  }
}

interface ProjetState {
  projets: Projet[];
  projetActifId: string | null;

  creerProjet: (nom: string, client: string, typologie: TypologieBache) => string;
  supprimerProjet: (id: string) => void;
  setProjetActif: (id: string | null) => void;
  getProjetActif: () => Projet | undefined;
  updateParams: (id: string, params: Projet['params']) => void;
  updateTissu: (id: string, tissu_id: string) => void;
  updateResultat: (id: string, resultat: ResultatPatronage) => void;
  updateChiffrage: (id: string, chiffrage: Chiffrage) => void;
  updateProjet: (id: string, updates: Partial<Projet>) => void;
}

export const useProjetStore = create<ProjetState>()(
  persist(
    (set, get) => ({
      projets: [],
      projetActifId: null,

      creerProjet: (nom, client, typologie) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const projet: Projet = {
          id,
          nom,
          client,
          reference: '',
          date_creation: now,
          date_modification: now,
          typologie,
          params: getDefaultParams(typologie),
          tissu_id: 'flexilight-402n-champagne',
        };
        set((state) => ({
          projets: [...state.projets, projet],
          projetActifId: id,
        }));
        return id;
      },

      supprimerProjet: (id) =>
        set((state) => ({
          projets: state.projets.filter((p) => p.id !== id),
          projetActifId: state.projetActifId === id ? null : state.projetActifId,
        })),

      setProjetActif: (id) => set({ projetActifId: id }),

      getProjetActif: () => {
        const state = get();
        return state.projets.find((p) => p.id === state.projetActifId);
      },

      updateParams: (id, params) =>
        set((state) => ({
          projets: state.projets.map((p) =>
            p.id === id
              ? { ...p, params, date_modification: new Date().toISOString() }
              : p,
          ),
        })),

      updateTissu: (id, tissu_id) =>
        set((state) => ({
          projets: state.projets.map((p) =>
            p.id === id
              ? { ...p, tissu_id, date_modification: new Date().toISOString() }
              : p,
          ),
        })),

      updateResultat: (id, resultat) =>
        set((state) => ({
          projets: state.projets.map((p) =>
            p.id === id
              ? { ...p, resultat, date_modification: new Date().toISOString() }
              : p,
          ),
        })),

      updateChiffrage: (id, chiffrage) =>
        set((state) => ({
          projets: state.projets.map((p) =>
            p.id === id
              ? { ...p, chiffrage, date_modification: new Date().toISOString() }
              : p,
          ),
        })),

      updateProjet: (id, updates) =>
        set((state) => ({
          projets: state.projets.map((p) =>
            p.id === id
              ? { ...p, ...updates, date_modification: new Date().toISOString() }
              : p,
          ),
        })),
    }),
    { name: 'bache-pro-projets' },
  ),
);
