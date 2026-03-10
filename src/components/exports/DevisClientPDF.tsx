"use client";

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Chiffrage, ResultatPatronage, Tissu } from '@/engine/types';
import { DUBLANC_LOGO_BASE64 } from '@/lib/pdf/logo';

const BLUE = '#1E3A5F';
const BLUE_LIGHT = '#EBF0F7';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const BORDER = '#D1D5DB';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1F2937' },

  // En-tete
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  companyBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBg: { backgroundColor: '#1E293B', borderRadius: 3, paddingVertical: 4, paddingHorizontal: 6 },
  logo: { height: 12 },
  companyTextBlock: {},
  companyName: { fontSize: 16, fontWeight: 'bold', color: BLUE },
  companyInfo: { fontSize: 8, color: GRAY, marginTop: 2, lineHeight: 1.5 },
  devisBlock: { textAlign: 'right' },
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
  tableHeaderCell: { color: 'white', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER, backgroundColor: '#FAFAFA' },
  tableCell: { fontSize: 9 },
  tableCellBold: { fontSize: 9, fontWeight: 'bold' },
  tableCellRight: { fontSize: 9, textAlign: 'right' },
  tableCellRightBold: { fontSize: 9, textAlign: 'right', fontWeight: 'bold' },

  // Totaux
  totauxContainer: { marginTop: 5, alignItems: 'flex-end' },
  totauxBox: { width: 250 },
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

interface Props {
  chiffrage: Chiffrage;
  projetNom: string;
  client?: string;
  description?: string;
  resultat?: ResultatPatronage;
  tissu?: Tissu;
  typologie?: string;
}

export default function DevisClientPDF({ chiffrage, projetNom, client, description, resultat, tissu, typologie }: Props) {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const devisNum = `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const tvaAmount = chiffrage.prix_vente_ttc - chiffrage.prix_vente_ht;

  // Coefficient de marge applique uniquement sur la matiere premiere et fournitures
  // (les taux horaires MO et deplacement sont deja des tarifs client)
  const totalMoEtDeplacement = chiffrage.mo_confection.total + chiffrage.mo_pose.total + chiffrage.deplacement.total;
  const totalMatiereEtFournitures = chiffrage.matiere.total + chiffrage.fournitures.reduce((s, f) => s + f.total, 0);
  const matiereVenteTotal = chiffrage.prix_vente_ht - totalMoEtDeplacement;
  const coefMatiere = totalMatiereEtFournitures > 0
    ? matiereVenteTotal / totalMatiereEtFournitures
    : 1;

  const fmt = (montant: number) => {
    const val = (Math.round(montant * 100) / 100).toFixed(2);
    const [entier, decimales] = val.split('.');
    const avecMilliers = (entier ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${avecMilliers},${decimales} €`;
  };

  // Lignes du devis
  const lignes: { designation: string; detail: string; quantite: string; pu: string; total: string }[] = [];

  // Matiere — majoree
  lignes.push({
    designation: 'Fourniture tissu',
    detail: tissu ? `${tissu.reference} — ${tissu.coloris}` : 'Tissu technique PVC/polyester',
    quantite: `${chiffrage.matiere.tissu_ml} ML`,
    pu: fmt(chiffrage.matiere.prix_ml * coefMatiere),
    total: fmt(chiffrage.matiere.total * coefMatiere),
  });

  // Fournitures — majorees
  if (chiffrage.fournitures.length > 0) {
    for (const f of chiffrage.fournitures) {
      lignes.push({
        designation: f.description,
        detail: '',
        quantite: String(f.quantite),
        pu: fmt(f.prix_unitaire * coefMatiere),
        total: fmt(f.total * coefMatiere),
      });
    }
  }

  // Confection — deja au tarif client
  lignes.push({
    designation: 'Confection en atelier',
    detail: '',
    quantite: `${chiffrage.mo_confection.heures} h`,
    pu: fmt(chiffrage.mo_confection.taux),
    total: fmt(chiffrage.mo_confection.total),
  });

  // Pose — deja au tarif client
  if (chiffrage.mo_pose.heures > 0) {
    lignes.push({
      designation: 'Pose sur site',
      detail: `${chiffrage.mo_pose.nb_poseurs} poseur${chiffrage.mo_pose.nb_poseurs > 1 ? 's' : ''}`,
      quantite: `${chiffrage.mo_pose.heures} h`,
      pu: fmt(chiffrage.mo_pose.taux),
      total: fmt(chiffrage.mo_pose.total),
    });
  }

  // Deplacement — deja au tarif client
  if (chiffrage.deplacement.total > 0) {
    lignes.push({
      designation: 'Deplacement',
      detail: `${chiffrage.deplacement.km} km A/R`,
      quantite: `${chiffrage.deplacement.km} km`,
      pu: fmt(chiffrage.deplacement.cout_km),
      total: fmt(chiffrage.deplacement.total),
    });
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tete */}
        <View style={s.header}>
          <View style={s.companyBlock}>
            <View style={s.logoBg}>
              <Image style={s.logo} src={DUBLANC_LOGO_BASE64} />
            </View>
            <View style={s.companyTextBlock}>
              <Text style={s.companyName}>STORES DUBLANC</Text>
              <Text style={s.companyInfo}>
                ALS CONFORT — SARL{'\n'}
                Avenue de Bordeaux, 40800 Aire-sur-l&apos;Adour{'\n'}
                SIRET : 440 547 800 00019
              </Text>
            </View>
          </View>
          <View style={s.devisBlock}>
            <Text style={s.devisTitle}>DEVIS</Text>
            <Text style={s.devisRef}>N° {devisNum}</Text>
            <Text style={s.devisRef}>Date : {today}</Text>
          </View>
        </View>

        <View style={s.accentBar} />

        {/* Client + Projet */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Client</Text>
            <Text style={s.infoValue}>{client || '—'}</Text>
          </View>
          <View style={s.infoBoxAccent}>
            <Text style={s.infoLabel}>Projet</Text>
            <Text style={s.infoValue}>{projetNom}</Text>
            {typologie && <Text style={s.infoValueSmall}>Typologie : {typologie}</Text>}
            {resultat && (
              <Text style={s.infoValueSmall}>
                {resultat.ml_total} ML — {resultat.nombre_laizes} laizes — {resultat.surface_totale_m2} m²
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

        {/* Tableau des prestations */}
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 2.5 }]}>Designation</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Quantite</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>P.U. HT</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total HT</Text>
          </View>
          {lignes.map((ligne, i) => (
            <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <View style={{ flex: 2.5 }}>
                <Text style={s.tableCellBold}>{ligne.designation}</Text>
                {ligne.detail ? <Text style={{ fontSize: 7.5, color: GRAY }}>{ligne.detail}</Text> : null}
              </View>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>{ligne.quantite}</Text>
              <Text style={[s.tableCellRight, { flex: 1 }]}>{ligne.pu}</Text>
              <Text style={[s.tableCellRightBold, { flex: 1 }]}>{ligne.total}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={s.totauxContainer}>
          <View style={s.totauxBox}>
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
          <Text style={s.conditionsTitle}>Conditions generales</Text>
          <Text style={s.conditionsText}>• Devis valable 30 jours a compter de la date d&apos;emission.</Text>
          <Text style={s.conditionsText}>• Acompte de 40% a la commande, solde a la livraison / pose.</Text>
          <Text style={s.conditionsText}>• Delai de fabrication : a confirmer selon disponibilite tissu.</Text>
          {tissu && tissu.garantie_ans > 0 && (
            <Text style={s.conditionsText}>• Garantie tissu : {tissu.garantie_ans} ans ({tissu.reference}).</Text>
          )}
          <Text style={s.conditionsText}>• Les travaux sont realises selon les regles de l&apos;art.</Text>
        </View>

        {/* Signature */}
        <View style={s.signatureSection}>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>ALS Confort — Stores Dublanc</Text>
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
          <Text style={s.footerText}>ALS Confort — Stores Dublanc — Avenue de Bordeaux, 40800 Aire-sur-l&apos;Adour — SIRET 440 547 800 00019</Text>
          <Text style={s.footerText}>Document genere par BachePro</Text>
          <Text style={s.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}
