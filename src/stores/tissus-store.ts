import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tissu } from '@/engine/types';
import { tissusDefaut } from '@/data/tissus-defaut';

interface TissusState {
  tissus: Tissu[];
  ajouterTissu: (tissu: Tissu) => void;
  modifierTissu: (id: string, tissu: Partial<Tissu>) => void;
  supprimerTissu: (id: string) => void;
  getTissuById: (id: string) => Tissu | undefined;
}

export const useTissusStore = create<TissusState>()(
  persist(
    (set, get) => ({
      tissus: tissusDefaut,

      ajouterTissu: (tissu) =>
        set((state) => ({ tissus: [...state.tissus, tissu] })),

      modifierTissu: (id, updates) =>
        set((state) => ({
          tissus: state.tissus.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),

      supprimerTissu: (id) =>
        set((state) => ({
          tissus: state.tissus.filter((t) => t.id !== id),
        })),

      getTissuById: (id) => get().tissus.find((t) => t.id === id),
    }),
    { name: 'bache-pro-tissus' },
  ),
);
