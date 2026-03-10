// ============================================================
// Types centraux du moteur de patronage BâchePro
// ============================================================

// --- Typologies ---

export type TypologieBache =
  | "tente-deux-pans"
  | "mono-pente"
  | "rectangulaire-plate"
  | "trapezoidale"
  | "pagode"
  | "tunnel"
  | "laterale-droite"
  | "forme-libre";

// --- Tissu ---

export interface Tissu {
  id: string;
  reference: string;           // "Flexilight Classic 402N"
  fournisseur: string;         // "Serge Ferrari"
  coloris: string;             // "Champagne"
  laize_mm: number;            // Largeur utile du rouleau
  grammage_g_m2: number;       // Poids en g/m²
  prix_ml_ht: number;          // Prix €/ML HT
  classification_feu: string;  // "M1", "M2", "B-s2,d0"
  usage: string[];
  garantie_ans: number;
  disponible: boolean;
  delai_jours: number;
}

// --- Géométrie 3D ---

/** Point 3D en mm */
export type Point3D = [number, number, number];

/** Point 2D en mm */
export type Point2D = [number, number];

/** Face d'un mesh : indices dans le tableau de vertices */
export interface Face {
  indices: number[];
  nom: string; // "versant", "pignon-avant", etc.
}

/** Mesh 3D = vertices + faces */
export interface Mesh3D {
  vertices: Point3D[];
  faces: Face[];
}

// --- Panneaux et bandes ---

export interface Bande {
  id: string;
  panneau_id: string;
  numero: number;
  longueur_mm: number;
  largeur_effective_mm: number;
  recouvrement_mm: number;
  sens_soudure: "gauche-droite" | "droite-gauche";
}

export interface Panneau {
  id: string;
  nom: string;                   // "Versant", "Pignon avant"
  vertices_2d: Point2D[];        // Contour du panneau déplié
  surface_m2: number;
  bandes: Bande[];
}

export interface ResultatPatronage {
  panneaux: Panneau[];
  ml_total: number;              // Mètres linéaires total arrondi
  nombre_laizes: number;         // Nombre total de bandes
  taux_chute_pct: number;        // % de chute tissu
  surface_totale_m2: number;     // Surface totale couverte
}

// --- Paramètres de patronage ---

export interface OptionsPatronage {
  ourlet_mm: number;             // Ourlet par bout de bande (profondeur)
  recouvrement_mm: number;       // Chevauchement entre bandes pour soudure
  laize_mm: number;              // Largeur utile du tissu
}

// --- Paramètres par typologie ---

export interface LambrequinParams {
  actif: boolean;
  longueur_mm: number;           // Longueur le long du bord
  hauteur_mm: number;            // Retombée
}

export interface TenteDeuxPansParams {
  largeur_base_mm: number;       // Largeur perpendiculaire au faîtage
  profondeur_mm: number;         // Longueur le long du faîtage
  rampant_gauche_mm: number;     // Longueur de pente côté gauche
  rampant_droit_mm: number;      // Longueur de pente côté droit
  hauteur_murs_mm: number;       // Hauteur des murs latéraux (retombée basse)
  lambrequin_gauche: LambrequinParams;
  lambrequin_droit: LambrequinParams;
  pignon_avant: boolean;         // Inclure le pignon avant
  pignon_arriere: boolean;       // Inclure le pignon arrière
}

export interface MonoPenteParams {
  largeur_mm: number;
  profondeur_mm: number;
  rampant_mm: number;            // Longueur de la pente unique
  hauteur_haute_mm: number;
  hauteur_basse_mm: number;
}

export interface RectangulairePlateParams {
  largeur_mm: number;
  profondeur_mm: number;
}

export interface TrapezoidaleParams {
  largeur_avant_mm: number;
  largeur_arriere_mm: number;
  profondeur_mm: number;
  rampant_mm: number;
}

export interface PagodeParams {
  largeur_mm: number;
  profondeur_mm: number;
  hauteur_faitage_mm: number;      // Hauteur du point central
  hauteur_bords_mm: number;        // Hauteur aux bords (retombée)
  rampant_mm: number;              // Longueur de pente du bord au sommet
}

export interface TunnelParams {
  largeur_mm: number;              // Diamètre / largeur au sol
  profondeur_mm: number;           // Longueur du tunnel
  hauteur_mm: number;              // Hauteur au sommet
  nb_facettes: number;             // Nombre de facettes pour approx du cylindre (defaut 8)
}

export interface LateraleDroiteParams {
  largeur_mm: number;
  hauteur_mm: number;              // Hauteur du pan lateral
  profondeur_mm: number;           // Profondeur (epaisseur)
}

export interface FormeLibreParams {
  vertices: Point2D[];             // Contour defini par l'utilisateur
  profondeur_mm: number;           // Epaisseur / hauteur si 3D
}

// --- Chiffrage ---

export interface Chiffrage {
  matiere: {
    tissu_ml: number;
    prix_ml: number;
    total: number;
  };
  fournitures: {
    description: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
  }[];
  mo_confection: {
    heures: number;
    taux: number;
    total: number;
    auto_estime: boolean;
  };
  mo_pose: {
    heures: number;
    nb_poseurs: number;
    taux: number;
    total: number;
    auto_estime: boolean;
  };
  deplacement: {
    km: number;
    cout_km: number;
    total: number;
  };
  sous_traitance: number;
  overhead_pct: number;
  overhead_montant: number;
  cout_revient_ht: number;
  marge_pct: number;
  prix_vente_ht: number;
  tva_taux: number;
  prix_vente_ttc: number;
}

// --- Projet ---

export interface Projet {
  id: string;
  nom: string;
  client: string;
  reference: string;
  date_creation: string;         // ISO date
  date_modification: string;     // ISO date
  typologie: TypologieBache;
  params: TenteDeuxPansParams | MonoPenteParams | RectangulairePlateParams | TrapezoidaleParams | PagodeParams | TunnelParams | LateraleDroiteParams | FormeLibreParams;
  tissu_id: string;
  resultat?: ResultatPatronage;
  chiffrage?: Chiffrage;
}
