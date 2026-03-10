export interface Fourniture {
  id: string;
  description: string;
  unite: string;
  prix_unitaire_ht: number; // Prix indicatif
  categorie: 'fixation' | 'couture' | 'accessoire';
}

export const fournituresDefaut: Fourniture[] = [
  {
    id: 'oeillet-inox-12',
    description: 'Œillet inox Ø12mm',
    unite: 'pièce',
    prix_unitaire_ht: 0.35,
    categorie: 'fixation',
  },
  {
    id: 'oeillet-inox-16',
    description: 'Œillet inox Ø16mm',
    unite: 'pièce',
    prix_unitaire_ht: 0.45,
    categorie: 'fixation',
  },
  {
    id: 'sangle-50mm',
    description: 'Sangle polyester 50mm',
    unite: 'mètre',
    prix_unitaire_ht: 1.80,
    categorie: 'fixation',
  },
  {
    id: 'sandow-8mm',
    description: 'Sandow élastique Ø8mm',
    unite: 'mètre',
    prix_unitaire_ht: 1.20,
    categorie: 'fixation',
  },
  {
    id: 'fil-polyester-20',
    description: 'Fil polyester Nm 20/3',
    unite: 'bobine',
    prix_unitaire_ht: 8.50,
    categorie: 'couture',
  },
  {
    id: 'crochet-inox',
    description: 'Crochet inox pour sandow',
    unite: 'pièce',
    prix_unitaire_ht: 0.65,
    categorie: 'accessoire',
  },
  {
    id: 'piton-plaque',
    description: 'Piton à plaque inox',
    unite: 'pièce',
    prix_unitaire_ht: 2.50,
    categorie: 'fixation',
  },
];
