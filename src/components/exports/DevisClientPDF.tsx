"use client";

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Chiffrage, ResultatPatronage, Tissu } from '@/engine/types';
import type { EntrepriseInfo } from '@/stores/parametres-store';
import { DUBLANC_LOGO_BASE64 } from '@/lib/pdf/logo';

const BLUE = '#1E3A5F';
const BLUE_LIGHT = '#EBF0F7';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const BORDER = '#D1D5DB';
const ORANGE = '#C2410C';
const ORANGE_BG = '#FFF7ED';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1F2937' },

  // En-tête — blocs séparés avec flex
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  companyBlock: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginRight: 20 },
  logoBg: { backgroundColor: '#1E293B', borderRadius: 3, paddingVertical: 4, paddingHorizontal: 6, flexShrink: 0 },
  logo: { height: 12 },
  companyTextBlock: { flex: 1 },
  companyName: { fontSize: 11, fontWeight: 'bold', color: BLUE },
  companyInfo: { fontSize: 7.5, color: GRAY, marginTop: 2, lineHeight: 1.5 },
  devisBlock: { flexShrink: 0, minWidth: 130, textAlign: 'right' },
  devisTitle: { fontSize: 20, fontWeight: 'bold', color: BLUE, letterSpacing: 1 },
  devisRef: { fontSize: 8, color: GRAY, marginTop: 4 },

  // Bandeau bleu
  accentBar: { height: 3, backgroundColor: BLUE, marginBottom: 20 },

  // Client + projet
  infoRow: { flexDirection: 'row', gap: 30, marginBottom: 20 },
  infoBox: { flex: 1, padding: 12, backgroundColor: GRAY_LIGHT, borderRadius: 4 },
  infoBoxAccent: { flex: 1, padding: 12, backgroundColor: BLUE_LIGHT, borderRadius: 4 },
  infoLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 10, fontWeight: 'bold' },
  infoValueSmall: { fontSize: 9, marginTop: 2 },

  // Objet
  objetSection: { marginBottom: 15 },
  objetTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  objetText: { fontSize: 9, color: '#374151', lineHeight: 1.4 },

  // Tableau
  table: { marginTop: 10, marginBottom: 15 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BLUE, paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  tableHeaderCell: { color: 'white', fontSize: 7.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER, backgroundColor: '#FAFAFA' },
  tableCell: { fontSize: 9 },
  tableCellGray: { fontSize: 8, color: GRAY },
  tableCellBold: { fontSize: 9, fontWeight: 'bold' },
  tableCellRight: { fontSize: 9, textAlign: 'right' },
  tableCellRightBold: { fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
  tableCellRemise: { fontSize: 8, textAlign: 'center', color: ORANGE, fontWeight: 'bold' },
  tableCellStrike: { fontSize: 8, textAlign: 'right', color: GRAY, textDecoration: 'line-through' },

  // Totaux
  totauxContainer: { marginTop: 5, alignItems: 'flex-end' },
  totauxBox: { width: 260 },
  totauxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totauxSeparator: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 4 },
  totauxTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, backgroundColor: BLUE, paddingHorizontal: 10, borderRadius: 3, marginTop: 4 },
  totauxTotalLabel: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  totauxTotalValue: { fontSize: 12, fontWeight: 'bold', color: 'white' },

  // Conditions
  conditionsSection: { marginTop: 25, padding: 12, backgroundColor: GRAY_LIGHT, borderRadius: 4 },
  conditionsTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  conditionsText: { fontSize: 8, color: '#4B5563', lineHeight: 1.5, marginBottom: 2 },

  // Signature
  signatureSection: { marginTop: 25, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: 220 },
  signatureLabel: { fontSize: 8, color: GRAY, marginBottom: 4 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 50, marginBottom: 4 },
  signatureHint: { fontSize: 7, color: GRAY, textAlign: 'center' },

  // Footer
  footer: { position: 'absolute', bottom: 15, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 6 },
  footerText: { fontSize: 6.5, color: '#9CA3AF' },
});

interface LignePDF {
  designation: string;
  detail: string;
  quantite: string;
  pu_brut: number;   // Prix unitaire avant remise
  remise_pct: number; // 0 = pas de remise
  pu_net: number;    // Prix unitaire après remise
  total: number;     // Total net HT
}

interface Props {
  chiffrage: Chiffrage;
  projetNom: string;
  client?: string;
  description?: string;
  resultat?: ResultatPatronage;
  tissu?: Tissu;
  typologie?: string;
  entreprise?: EntrepriseInfo;
}

export default function DevisClientPDF({ chiffrage, projetNom, client, description, resultat, tissu, typologie, entreprise }: Props) {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const devisNum = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const tvaAmount = chiffrage.prix_vente_ttc - chiffrage.prix_vente_ht;

  const rp = chiffrage.remises_pct;
  const remiseFourniture = rp?.fourniture_pct ?? 0;
  const remiseConfection = rp?.confection_pct ?? 0;
  const remisePose = rp?.pose_pct ?? 0;
  const remiseDeplacement = rp?.deplacement_pct ?? 0;

  const fmt = (montant: number) => {
    // Note: react-pdf/Helvetica ne supporte pas le séparateur de milliers (espace ou thin-space)
    // → format simple xx xxx,xx sans séparateur de groupe
    const val = (Math.round(montant * 100) / 100).toFixed(2).replace('.', ',');
    return `${val} EUR`;
  };

  // MO et déplacement : le taux est déjà un tarif de vente client → pas de coefficient
  // Matière : on applique un coefMatiere calculé pour que la somme des lignes = prix_vente_ht
  const totalCostMatiere = chiffrage.matiere.total
    + chiffrage.fournitures.reduce((acc, f) => acc + f.total, 0);
  const totalMoNet = chiffrage.mo_confection.total * (1 - remiseConfection / 100)
    + chiffrage.mo_pose.total * (1 - remisePose / 100);
  const totalDeplNet = chiffrage.deplacement.total * (1 - remiseDeplacement / 100);
  const baseMatiere = totalCostMatiere * (1 - remiseFourniture / 100);
  const coefMatiere = baseMatiere > 0
    ? (chiffrage.prix_vente_ht - totalMoNet - totalDeplNet) / baseMatiere
    : 1;

  // Helper matière : pu_net = cout_pu × coefMatiere, pu_brut = pu_net / (1 - remise%)
  const mkMatiere = (
    designation: string,
    detail: string,
    quantite: string,
    cout_pu: number,
    qty_num: number,
  ): LignePDF => {
    const pu_net = cout_pu * coefMatiere;
    const pu_brut = remiseFourniture > 0 ? pu_net / (1 - remiseFourniture / 100) : pu_net;
    return { designation, detail, quantite, pu_brut, remise_pct: remiseFourniture, pu_net, total: pu_net * qty_num };
  };

  // Helper MO/déplacement : taux = tarif client, remise appliquée sans coef
  const mkMo = (
    designation: string,
    detail: string,
    quantite: string,
    taux: number,
    heures: number,
    remise: number,
  ): LignePDF => {
    const pu_net = taux * (1 - remise / 100);
    return { designation, detail, quantite, pu_brut: taux, remise_pct: remise, pu_net, total: pu_net * heures };
  };

  const lignes: LignePDF[] = [];

  // Tissu
  lignes.push(mkMatiere(
    'Fourniture tissu',
    tissu ? `${tissu.reference} - ${tissu.coloris}` : 'Tissu technique PVC/polyester',
    `${chiffrage.matiere.tissu_ml} ML`,
    chiffrage.matiere.prix_ml,
    chiffrage.matiere.tissu_ml,
  ));

  // Fournitures
  for (const f of chiffrage.fournitures) {
    lignes.push(mkMatiere(
      f.description,
      '',
      String(f.quantite),
      f.prix_unitaire,
      f.quantite,
    ));
  }

  // Confection
  lignes.push(mkMo(
    'Confection en atelier',
    '',
    `${chiffrage.mo_confection.heures} h`,
    chiffrage.mo_confection.taux,
    chiffrage.mo_confection.heures,
    remiseConfection,
  ));

  // Pose
  if (chiffrage.mo_pose.heures > 0) {
    lignes.push(mkMo(
      'Pose sur site',
      `${chiffrage.mo_pose.nb_poseurs} poseur${chiffrage.mo_pose.nb_poseurs > 1 ? 's' : ''}`,
      `${chiffrage.mo_pose.heures} h`,
      chiffrage.mo_pose.taux,
      chiffrage.mo_pose.heures,
      remisePose,
    ));
  }

  // Déplacement
  if (chiffrage.deplacement.total > 0) {
    lignes.push(mkMo(
      'Déplacement',
      `${chiffrage.deplacement.km} km A/R`,
      `${chiffrage.deplacement.km} km`,
      chiffrage.deplacement.cout_km,
      chiffrage.deplacement.km,
      remiseDeplacement,
    ));
  }

  const hasAnyRemise = lignes.some(l => l.remise_pct > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View style={s.companyBlock}>
            <View style={s.logoBg}>
              <Image style={s.logo} src={DUBLANC_LOGO_BASE64} />
            </View>
            <View style={s.companyTextBlock}>
              <Text style={s.companyName}>{entreprise?.nom ?? 'STORES DUBLANC'}</Text>
              <Text style={s.companyInfo}>
                {entreprise
                  ? `${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}`
                  : "Avenue de Bordeaux, 40800 Aire-sur-l'Adour"}
                {entreprise?.siret ? `\nSIRET : ${entreprise.siret}` : '\nSIRET : 440 547 800 00019'}
                {entreprise?.tel ? `\nTel. ${entreprise.tel}` : ''}
              </Text>
            </View>
          </View>
          <View style={s.devisBlock}>
            <Text style={s.devisTitle}>DEVIS</Text>
            <Text style={s.devisRef}>No. {devisNum}</Text>
            <Text style={s.devisRef}>Date : {today}</Text>
          </View>
        </View>

        <View style={s.accentBar} />

        {/* Client + Projet */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Client</Text>
            <Text style={s.infoValue}>{client || '-'}</Text>
          </View>
          <View style={s.infoBoxAccent}>
            <Text style={s.infoLabel}>Projet</Text>
            <Text style={s.infoValue}>{projetNom}</Text>
            {typologie && <Text style={s.infoValueSmall}>Typologie : {typologie}</Text>}
            {resultat && (
              <Text style={s.infoValueSmall}>
                {`${resultat.ml_total} ML - ${resultat.nombre_laizes} laizes - ${resultat.surface_totale_m2} m2`}
              </Text>
            )}
          </View>
        </View>

        {/* Objet */}
        {description && (
          <View style={s.objetSection}>
            <Text style={s.objetTitle}>Objet</Text>
            <Text style={s.objetText}>{description}</Text>
          </View>
        )}

        {/* Tableau */}
        <View style={s.table}>
          {/* En-tête tableau */}
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 2.5 }]}>Désignation</Text>
            <Text style={[s.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>Quantité</Text>
            {hasAnyRemise ? (
              <>
                <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>P.U. brut</Text>
                <Text style={[s.tableHeaderCell, { flex: 0.6, textAlign: 'center' }]}>Remise</Text>
                <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>P.U. net</Text>
              </>
            ) : (
              <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>P.U. HT</Text>
            )}
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total HT</Text>
          </View>

          {/* Lignes */}
          {lignes.map((ligne, i) => (
            <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <View style={{ flex: 2.5 }}>
                <Text style={s.tableCellBold}>{ligne.designation}</Text>
                {ligne.detail ? <Text style={s.tableCellGray}>{ligne.detail}</Text> : null}
              </View>
              <Text style={[s.tableCell, { flex: 0.8, textAlign: 'center' }]}>{ligne.quantite}</Text>
              {hasAnyRemise ? (
                <>
                  {ligne.remise_pct > 0 ? (
                    <Text style={[s.tableCellStrike, { flex: 1 }]}>{fmt(ligne.pu_brut)}</Text>
                  ) : (
                    <Text style={[s.tableCellRight, { flex: 1 }]}>{fmt(ligne.pu_brut)}</Text>
                  )}
                  <Text style={[s.tableCellRemise, { flex: 0.6 }]}>
                    {ligne.remise_pct > 0 ? `-${ligne.remise_pct}%` : ''}
                  </Text>
                  <Text style={[s.tableCellRight, { flex: 1 }]}>{fmt(ligne.pu_net)}</Text>
                </>
              ) : (
                <Text style={[s.tableCellRight, { flex: 1 }]}>{fmt(ligne.pu_net)}</Text>
              )}
              <Text style={[s.tableCellRightBold, { flex: 1 }]}>{fmt(ligne.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={s.totauxContainer}>
          <View style={s.totauxBox}>
            {chiffrage.remise_commerciale_ht > 0 && (
              <>
                <View style={s.totauxRow}>
                  <Text style={s.tableCell}>Sous-total HT</Text>
                  <Text style={s.tableCellRight}>{fmt(chiffrage.prix_vente_ht + chiffrage.remise_commerciale_ht)}</Text>
                </View>
                <View style={[s.totauxRow, { backgroundColor: ORANGE_BG, paddingHorizontal: 4, borderRadius: 2 }]}>
                  <Text style={[s.tableCell, { color: ORANGE }]}>Remise commerciale</Text>
                  <Text style={[s.tableCellRightBold, { color: ORANGE }]}>{`- ${fmt(chiffrage.remise_commerciale_ht)}`}</Text>
                </View>
              </>
            )}
            <View style={s.totauxRow}>
              <Text style={s.tableCell}>Total HT</Text>
              <Text style={s.tableCellRightBold}>{fmt(chiffrage.prix_vente_ht)}</Text>
            </View>
            <View style={s.totauxRow}>
              <Text style={s.tableCell}>TVA ({chiffrage.tva_taux}%)</Text>
              <Text style={s.tableCellRight}>{fmt(tvaAmount)}</Text>
            </View>
            <View style={s.totauxSeparator} />
            <View style={s.totauxTotalRow}>
              <Text style={s.totauxTotalLabel}>Total TTC</Text>
              <Text style={s.totauxTotalValue}>{fmt(chiffrage.prix_vente_ttc)}</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        <View style={s.conditionsSection}>
          <Text style={s.conditionsTitle}>Conditions générales</Text>
          <Text style={s.conditionsText}>- Devis valable 30 jours a compter de la date d'emission.</Text>
          <Text style={s.conditionsText}>- Acompte de 40% a la commande, solde a la livraison / pose.</Text>
          <Text style={s.conditionsText}>- Delai de fabrication : a confirmer selon disponibilite tissu.</Text>
          {tissu && tissu.garantie_ans > 0 && (
            <Text style={s.conditionsText}>{`- Garantie tissu : ${tissu.garantie_ans} ans (${tissu.reference}).`}</Text>
          )}
          <Text style={s.conditionsText}>- Les travaux sont realises selon les regles de l'art.</Text>
        </View>

        {/* Signature */}
        <View style={s.signatureSection}>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>{entreprise?.nom ?? 'Stores Dublanc'}</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureHint}>Signature</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Bon pour accord — Le client</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureHint}>Date, signature et mention «Bon pour accord»</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {entreprise?.nom ?? 'Stores Dublanc'} — {entreprise ? `${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}` : "Avenue de Bordeaux, 40800 Aire-sur-l'Adour"}{entreprise?.siret ? ` — SIRET ${entreprise.siret}` : ''}
          </Text>
          <Text style={s.footerText}>Document généré par BâchePro</Text>
          <Text style={s.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
