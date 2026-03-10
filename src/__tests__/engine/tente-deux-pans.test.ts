import { describe, it, expect } from 'vitest';
import { genererPanneaux } from '@/engine/typologies/tente-deux-pans';
import type { TenteDeuxPansParams, OptionsPatronage } from '@/engine/types';
import { arrondirML, OURLET_MM, RECOUVREMENT_MM } from '@/lib/constants';

/**
 * Cas de test de référence : Projet LDC 32
 * Tente deux pans pour un camping du Gers
 *
 * Données d'entrée :
 * - Largeur base : 4430 mm
 * - Profondeur : 13600 mm
 * - Rampant (gauche et droit) : 3500 mm
 * - Hauteur murs latéraux : 400 mm
 * - Lambrequin droit : H=400mm (retombée du versant)
 * - Lambrequin gauche : non
 * - Tissu : Flexilight Classic 402N, laize 2670 mm
 *
 * Résultat attendu : 55.40 ML
 */

const LDC32_PARAMS: TenteDeuxPansParams = {
  largeur_base_mm: 4430,
  profondeur_mm: 13600,
  rampant_gauche_mm: 3500,
  rampant_droit_mm: 3500,
  hauteur_murs_mm: 400,
  lambrequin_gauche: { actif: false, longueur_mm: 0, hauteur_mm: 0 },
  lambrequin_droit: { actif: true, longueur_mm: 1300, hauteur_mm: 400 },
  pignon_avant: true,
  pignon_arriere: true,
};

const LDC32_OPTIONS: OptionsPatronage = {
  laize_mm: 2670,
  ourlet_mm: OURLET_MM,       // 100mm
  recouvrement_mm: RECOUVREMENT_MM, // 40mm
};

describe('Tente deux pans — Projet LDC 32', () => {
  const resultat = genererPanneaux(LDC32_PARAMS, LDC32_OPTIONS);

  it('doit retourner 55.40 ML au total', () => {
    expect(resultat.ml_total).toBe(55.40);
  });

  it('doit avoir 3 panneaux (versant + 2 pignons)', () => {
    expect(resultat.panneaux).toHaveLength(3);
  });

  it('doit avoir 7 laizes au total (3 versant + 2×2 pignons)', () => {
    expect(resultat.nombre_laizes).toBe(7);
  });

  describe('Versant', () => {
    const versant = resultat.panneaux.find(p => p.id === 'versant');

    it('existe', () => {
      expect(versant).toBeDefined();
    });

    it('a un développé de 7400mm (0 + 3500 + 3500 + 400)', () => {
      // Le développé = largeur du rectangle déplié
      const largeur = versant!.vertices_2d[1]![0] - versant!.vertices_2d[0]![0];
      expect(largeur).toBe(7400);
    });

    it('a 3 laizes', () => {
      expect(versant!.bandes).toHaveLength(3);
    });

    it('chaque bande fait 13.80 ML (13600 + 2×100mm ourlet)', () => {
      for (const bande of versant!.bandes) {
        expect(bande.longueur_mm).toBe(13800);
        expect(arrondirML(bande.longueur_mm)).toBe(13.80);
      }
    });

    it('versant total = 3 × 13.80 = 41.40 ML', () => {
      const ml_versant = versant!.bandes.reduce(
        (acc, b) => acc + arrondirML(b.longueur_mm),
        0,
      );
      expect(Math.round(ml_versant * 100) / 100).toBe(41.40);
    });
  });

  describe('Pignons', () => {
    const pignon_av = resultat.panneaux.find(p => p.id === 'pignon-avant');
    const pignon_ar = resultat.panneaux.find(p => p.id === 'pignon-arriere');

    it('les deux pignons existent', () => {
      expect(pignon_av).toBeDefined();
      expect(pignon_ar).toBeDefined();
    });

    it('chaque pignon a 2 laizes', () => {
      expect(pignon_av!.bandes).toHaveLength(2);
      expect(pignon_ar!.bandes).toHaveLength(2);
    });

    it('chaque bande pignon fait 3.50 ML (rampant = 3500mm)', () => {
      for (const bande of [...pignon_av!.bandes, ...pignon_ar!.bandes]) {
        expect(bande.longueur_mm).toBe(3500);
        expect(arrondirML(bande.longueur_mm)).toBe(3.50);
      }
    });

    it('pignons total = 4 × 3.50 = 14.00 ML', () => {
      const ml_pignons = [...pignon_av!.bandes, ...pignon_ar!.bandes].reduce(
        (acc, b) => acc + arrondirML(b.longueur_mm),
        0,
      );
      expect(Math.round(ml_pignons * 100) / 100).toBe(14.00);
    });
  });
});

describe('arrondirML', () => {
  it('arrondit au décimètre supérieur', () => {
    expect(arrondirML(13750)).toBe(13.80);
    expect(arrondirML(13800)).toBe(13.80);
    expect(arrondirML(13600)).toBe(13.60);
    expect(arrondirML(3500)).toBe(3.50);
    expect(arrondirML(3501)).toBe(3.60);
    expect(arrondirML(100)).toBe(0.10);
  });
});
