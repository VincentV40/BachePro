import { describe, it, expect } from 'vitest';
import { genererPanneaux } from '@/engine/typologies/tente-deux-pans';
import { calculerOptimisationLambrequin } from '@/engine/geometry/lambrequins';
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

/**
 * Cas de test 2 — Données génériques (vérification manuelle)
 *
 * Données d'entrée :
 * - Largeur base : 4000 mm
 * - Profondeur : 10000 mm
 * - Rampant gauche & droit : 3000 mm
 * - Hauteur murs latéraux : 300 mm (non utilisé dans le versant — voir note ci-dessous)
 * - Lambrequins : désactivés (retombées = 0)
 * - Pignon avant & arrière : oui
 * - Laize : 2670 mm
 *
 * Résultat attendu moteur : 42.60 ML
 *
 * Note sur l'écart avec le calcul géométrique pur (40.86 ML) :
 * Le moteur utilise le rampant comme longueur de bande des pignons (3000mm = 3.00 ML),
 * non la hauteur géométrique du triangle (sqrt(3000²-2000²) = 2236mm → 2.30 ML).
 * Cela correspond au besoin atelier : on commande la longueur du rampant pour avoir
 * la marge de découpe suffisante sur le triangle.
 * De plus, la hauteur_murs_mm n'est pas incluse dans le développé versant (les murs
 * latéraux ne font pas partie du versant principal, ils sont gérés séparément ou ignorés
 * quand il n'y a pas de lambrequin).
 */

const CAS2_PARAMS: TenteDeuxPansParams = {
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

const CAS2_OPTIONS: OptionsPatronage = {
  laize_mm: 2670,
  ourlet_mm: OURLET_MM,        // 100mm
  recouvrement_mm: RECOUVREMENT_MM, // 40mm
};

describe('Tente deux pans — Cas générique 4000×10000mm', () => {
  const resultat = genererPanneaux(CAS2_PARAMS, CAS2_OPTIONS);

  it('doit retourner 42.60 ML au total', () => {
    expect(resultat.ml_total).toBe(42.60);
  });

  it('doit avoir 3 panneaux (versant + 2 pignons)', () => {
    expect(resultat.panneaux).toHaveLength(3);
  });

  it('doit avoir 7 laizes au total (3 versant + 2×2 pignons)', () => {
    expect(resultat.nombre_laizes).toBe(7);
  });

  describe('Versant', () => {
    const versant = resultat.panneaux.find(p => p.id === 'versant');

    it('a un développé de 6000mm (0 + 3000 + 3000 + 0 — pas de lambrequins)', () => {
      const largeur = versant!.vertices_2d[1]![0] - versant!.vertices_2d[0]![0];
      expect(largeur).toBe(6000);
    });

    it('a 3 laizes (ceil(6000 / 2670) = 3)', () => {
      expect(versant!.bandes).toHaveLength(3);
    });

    it('chaque bande fait 10.20 ML (10000mm profondeur + 2×100mm ourlet = 10200mm)', () => {
      for (const bande of versant!.bandes) {
        expect(bande.longueur_mm).toBe(10200);
        expect(arrondirML(bande.longueur_mm)).toBe(10.20);
      }
    });

    it('versant total = 3 × 10.20 = 30.60 ML', () => {
      const ml_versant = versant!.bandes.reduce(
        (acc, b) => acc + arrondirML(b.longueur_mm),
        0,
      );
      expect(Math.round(ml_versant * 100) / 100).toBe(30.60);
    });
  });

  describe('Pignons', () => {
    const pignon_av = resultat.panneaux.find(p => p.id === 'pignon-avant');
    const pignon_ar = resultat.panneaux.find(p => p.id === 'pignon-arriere');

    it('les deux pignons existent', () => {
      expect(pignon_av).toBeDefined();
      expect(pignon_ar).toBeDefined();
    });

    it('chaque pignon a 2 laizes (ceil(4000 / 2670) = 2)', () => {
      expect(pignon_av!.bandes).toHaveLength(2);
      expect(pignon_ar!.bandes).toHaveLength(2);
    });

    it('chaque bande pignon fait 3.00 ML (rampant = 3000mm)', () => {
      for (const bande of [...pignon_av!.bandes, ...pignon_ar!.bandes]) {
        expect(bande.longueur_mm).toBe(3000);
        expect(arrondirML(bande.longueur_mm)).toBe(3.00);
      }
    });

    it('pignons total = 4 × 3.00 = 12.00 ML', () => {
      const ml_pignons = [...pignon_av!.bandes, ...pignon_ar!.bandes].reduce(
        (acc, b) => acc + arrondirML(b.longueur_mm),
        0,
      );
      expect(Math.round(ml_pignons * 100) / 100).toBe(12.00);
    });
  });
});

describe('Lambrequins — optimisation chute pignon', () => {
  it('LDC 32 : lambrequin droit pris en chute (1929mm >= 1300mm)', () => {
    // demi_base=2215, h_eff=3500-400=3100, largeur_inscrit=2215×(1-400/3100)=1929mm
    const { pris_en_chute, largeur_disponible } = calculerOptimisationLambrequin(
      1300, // longueur_mm
      400,  // hauteur_mm
      4430, // largeur_base_mm
      3500, // rampant_mm
      400,  // hauteur_murs_mm
    );
    expect(pris_en_chute).toBe(true);
    expect(largeur_disponible).toBe(1929);
  });

  it('Lambrequin trop long → panneau dédié', () => {
    // demi_base=2000, h_eff=3000-300=2700, largeur_inscrit=2000×(1-600/2700)≈1556mm < 10000mm
    const { pris_en_chute, largeur_disponible } = calculerOptimisationLambrequin(
      10000, // longueur_mm (profondeur totale)
      600,   // hauteur_mm
      4000,  // largeur_base_mm
      3000,  // rampant_mm
      300,   // hauteur_murs_mm
    );
    expect(pris_en_chute).toBe(false);
    expect(largeur_disponible).toBeLessThan(10000);
  });

  it('Lambrequin trop haut (h >= h_eff) → jamais pris en chute', () => {
    const { pris_en_chute } = calculerOptimisationLambrequin(
      100,  // longueur_mm (très court)
      3500, // hauteur_mm = rampant entier
      4000,
      3500,
      400,
    );
    expect(pris_en_chute).toBe(false);
  });

  it('LDC 32 : lambrequin actif pris en chute → ML total inchangé (55.40)', () => {
    const resultat = genererPanneaux(LDC32_PARAMS, LDC32_OPTIONS);
    expect(resultat.ml_total).toBe(55.40);
    expect(resultat.lambrequins).toBeDefined();
    expect(resultat.lambrequins).toHaveLength(1); // seul lambrequin_droit est actif
    expect(resultat.lambrequins![0]!.pris_en_chute).toBe(true);
    expect(resultat.lambrequins![0]!.ml_dedie).toBe(0);
  });

  it('Lambrequin dédié : panneau ajouté + ML inclus dans total', () => {
    const params: TenteDeuxPansParams = {
      largeur_base_mm: 4000,
      profondeur_mm: 10000,
      rampant_gauche_mm: 3000,
      rampant_droit_mm: 3000,
      hauteur_murs_mm: 300,
      lambrequin_gauche: { actif: true, longueur_mm: 10000, hauteur_mm: 600 },
      lambrequin_droit: { actif: false, longueur_mm: 0, hauteur_mm: 0 },
      pignon_avant: true,
      pignon_arriere: true,
    };
    const resultat = genererPanneaux(params, CAS2_OPTIONS);
    // 4 panneaux : versant + 2 pignons + 1 lambrequin dédié
    expect(resultat.panneaux).toHaveLength(4);
    expect(resultat.lambrequins).toHaveLength(1);
    expect(resultat.lambrequins![0]!.pris_en_chute).toBe(false);
    expect(resultat.lambrequins![0]!.ml_dedie).toBeGreaterThan(0);
    expect(resultat.ml_total).toBeGreaterThan(42.60);
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
