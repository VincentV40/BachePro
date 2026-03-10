// API publique du moteur de patronage BâchePro
export * from './types';

export {
  genererGeometrie as genererGeometrieTenteDeuxPans,
  genererPanneaux as genererPanneauxTenteDeuxPans,
} from './typologies/tente-deux-pans';

export {
  genererGeometrie as genererGeometrieMonoPente,
  genererPanneaux as genererPanneauxMonoPente,
} from './typologies/mono-pente';

export {
  genererGeometrie as genererGeometrieRectangulairePlate,
  genererPanneaux as genererPanneauxRectangulairePlate,
} from './typologies/rectangulaire-plate';

export {
  genererGeometrie as genererGeometrieTrapezoidale,
  genererPanneaux as genererPanneauxTrapezoidale,
} from './typologies/trapezoidale';

export {
  genererGeometrie as genererGeometriePagode,
  genererPanneaux as genererPanneauxPagode,
} from './typologies/pagode';

export {
  genererGeometrie as genererGeometrieTunnel,
  genererPanneaux as genererPanneauxTunnel,
} from './typologies/tunnel';

export {
  genererGeometrie as genererGeometrieLateraleDroite,
  genererPanneaux as genererPanneauxLateraleDroite,
} from './typologies/laterale-droite';

export {
  genererGeometrie as genererGeometrieFormeLibre,
  genererPanneaux as genererPanneauxFormeLibre,
} from './typologies/forme-libre';

export { arrondirML } from '@/lib/constants';
