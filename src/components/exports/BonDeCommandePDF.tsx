"use client";

import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResultatPatronage, Tissu } from '@/engine/types';
import type { EntrepriseInfo } from '@/stores/parametres-store';

const BLUE = '#1E3A5F';
const GRAY = '#6B7280';
const GRAY_LIGHT = '#F3F4F6';
const BORDER = '#D1D5DB';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1F2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  companyName: { fontSize: 15, fontWeight: 'bold', color: BLUE },
  companyInfo: { fontSize: 8, color: GRAY, marginTop: 2, lineHeight: 1.5 },
  docBlock: { textAlign: 'right' },
  docTitle: { fontSize: 18, fontWeight: 'bold', color: BLUE },
  docRef: { fontSize: 8, color: GRAY, marginTop: 3 },
  accentBar: { height: 3, backgroundColor: BLUE, marginBottom: 18 },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 18 },
  infoBox: { flex: 1, padding: 10, backgroundColor: GRAY_LIGHT, borderRadius: 3 },
  infoLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 10, fontWeight: 'bold' },
  infoValueSmall: { fontSize: 8.5, marginTop: 1.5, color: '#374151' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: BLUE, marginBottom: 6, marginTop: 14 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BLUE, paddingVertical: 5, paddingHorizontal: 8 },
  tableHeaderCell: { color: 'white', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER, backgroundColor: '#FAFAFA' },
  cellSm: { fontSize: 8.5 },
  cellRight: { fontSize: 8.5, textAlign: 'right' },
  cellRightBold: { fontSize: 8.5, textAlign: 'right', fontWeight: 'bold' },
  totauxContainer: { marginTop: 8, alignItems: 'flex-end' },
  totauxBox: { width: 230 },
  totauxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totauxSep: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 4 },
  totauxFinalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: BLUE, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 3, marginTop: 4 },
  totauxFinalLabel: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  totauxFinalValue: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  observationsBox: { marginTop: 16, padding: 10, borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, minHeight: 50 },
  observationsLabel: { fontSize: 7, color: GRAY, textTransform: 'uppercase', marginBottom: 4 },
  observationsText: { fontSize: 8.5, color: '#374151', lineHeight: 1.4 },
  signatureSection: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: 210 },
  signatureLabel: { fontSize: 8, color: GRAY, marginBottom: 4 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#000', marginTop: 45, marginBottom: 3 },
  signatureHint: { fontSize: 7, color: GRAY, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 15, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 5 },
  footerText: { fontSize: 6.5, color: '#9CA3AF' },
});

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  projetNom: string;
  client?: string;
  observations?: string;
  entreprise?: EntrepriseInfo;
}

export default function BonDeCommandePDF({ resultat, tissu, projetNom, client, observations, entreprise }: Props) {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const bcNum = `BC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const montantHT = Math.round(resultat.ml_total * tissu.prix_ml_ht * 100) / 100;
  const tva = Math.round(montantHT * 0.20 * 100) / 100;
  const ttc = Math.round((montantHT + tva) * 100) / 100;
  const fmt = (v: number) => v.toFixed(2) + ' \u20ac';

  const nomEnt = entreprise?.nom ?? 'STORES DUBLANC';
  const adresseEnt = entreprise
    ? `${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}`
    : "Avenue de Bordeaux, 40800 Aire-sur-l'Adour";
  const siretEnt = entreprise?.siret ?? '';
  const telEnt = entreprise?.tel ?? '';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tete */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{nomEnt}</Text>
            <Text style={s.companyInfo}>{adresseEnt}</Text>
            {telEnt ? <Text style={s.companyInfo}>Tel. {telEnt}</Text> : null}
            {siretEnt ? <Text style={s.companyInfo}>SIRET : {siretEnt}</Text> : null}
          </View>
          <View style={s.docBlock}>
            <Text style={s.docTitle}>BON DE COMMANDE</Text>
            <Text style={s.docRef}>N\u00b0 {bcNum}</Text>
            <Text style={s.docRef}>Date : {today}</Text>
          </View>
        </View>

        <View style={s.accentBar} />

        {/* Projet + Tissu */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Projet</Text>
            <Text style={s.infoValue}>{projetNom}</Text>
            {client ? <Text style={s.infoValueSmall}>Client : {client}</Text> : null}
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Tissu selectionne</Text>
            <Text style={s.infoValue}>{tissu.reference}</Text>
            <Text style={s.infoValueSmall}>{tissu.coloris} \u2014 {tissu.fournisseur}</Text>
            <Text style={s.infoValueSmall}>Laize {tissu.laize_mm} mm \u00b7 {tissu.grammage_g_m2} g/m\u00b2 \u00b7 {tissu.classification_feu}</Text>
          </View>
        </View>

        {/* Tableau */}
        <Text style={s.sectionTitle}>Commande tissu</Text>
        <View>
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, { flex: 2.5 }]}>Designation</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Quantite</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>P.U. HT</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total HT</Text>
          </View>
          <View style={s.tableRow}>
            <View style={{ flex: 2.5 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{tissu.reference} \u2014 {tissu.coloris}</Text>
              <Text style={{ fontSize: 7.5, color: GRAY }}>
                {tissu.fournisseur} \u00b7 Laize {tissu.laize_mm} mm \u00b7 {tissu.grammage_g_m2} g/m\u00b2
                {tissu.delai_jours > 0 ? ` \u00b7 Delai : ${tissu.delai_jours} j` : ''}
              </Text>
            </View>
            <Text style={[s.cellSm, { flex: 1, textAlign: 'center' }]}>{resultat.ml_total} ML</Text>
            <Text style={[s.cellRight, { flex: 1 }]}>{fmt(tissu.prix_ml_ht)}/ML</Text>
            <Text style={[s.cellRightBold, { flex: 1 }]}>{fmt(montantHT)}</Text>
          </View>
          <View style={s.tableRowAlt}>
            <Text style={[s.cellSm, { flex: 2.5, color: GRAY }]}>
              Plan de coupe : {resultat.nombre_laizes} laizes \u00b7 {resultat.surface_totale_m2} m\u00b2
              {resultat.taux_chute_pct > 0 ? ` \u00b7 chute ${resultat.taux_chute_pct}%` : ''}
            </Text>
            <Text style={{ flex: 3 }} />
          </View>
        </View>

        {/* Totaux */}
        <View style={s.totauxContainer}>
          <View style={s.totauxBox}>
            <View style={s.totauxRow}>
              <Text style={s.cellSm}>Sous-total HT</Text>
              <Text style={s.cellRightBold}>{fmt(montantHT)}</Text>
            </View>
            <View style={s.totauxRow}>
              <Text style={s.cellSm}>TVA 20%</Text>
              <Text style={s.cellRight}>{fmt(tva)}</Text>
            </View>
            <View style={s.totauxSep} />
            <View style={s.totauxFinalRow}>
              <Text style={s.totauxFinalLabel}>Total TTC</Text>
              <Text style={s.totauxFinalValue}>{fmt(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* Observations */}
        <View style={s.observationsBox}>
          <Text style={s.observationsLabel}>Observations / Instructions de coupe</Text>
          {observations ? (
            <Text style={s.observationsText}>{observations}</Text>
          ) : (
            <Text style={[s.observationsText, { color: '#9CA3AF' }]}>
              Laisser vide ou completer avant envoi au fournisseur.
            </Text>
          )}
        </View>

        {/* Signatures */}
        <View style={s.signatureSection}>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Donneur d ordre \u2014 {nomEnt}</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureHint}>Date et signature</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureLabel}>Accuse reception \u2014 Fournisseur</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureHint}>Date, tampon et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{nomEnt} \u2014 {adresseEnt}{siretEnt ? ` \u2014 SIRET ${siretEnt}` : ''}</Text>
          <Text style={s.footerText}>BachePro \u2014 {today}</Text>
        </View>
      </Page>
    </Document>
  );
}
