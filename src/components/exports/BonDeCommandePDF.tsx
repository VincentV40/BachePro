"use client";

import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { ResultatPatronage, Tissu } from '@/engine/types';
import { pdfStyles as s } from '@/lib/pdf/styles';
import { Cartouche } from '@/lib/pdf/cartouche';

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  projetNom: string;
  client?: string;
}

export default function BonDeCommandePDF({ resultat, tissu, projetNom, client }: Props) {
  const montant = Math.round(resultat.ml_total * tissu.prix_ml_ht * 100) / 100;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Cartouche projetNom={projetNom} client={client} />

        <Text style={s.h1}>Bon de commande tissu</Text>

        <View style={{ marginTop: 20 }}>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={{ ...s.tableCell, flex: 2 }}>Designation</Text>
              <Text style={s.tableCellRight}>Quantite</Text>
              <Text style={s.tableCellRight}>PU HT</Text>
              <Text style={s.tableCellRight}>Total HT</Text>
            </View>

            <View style={s.tableRow}>
              <Text style={{ ...s.tableCell, flex: 2 }}>
                {tissu.reference} — {tissu.coloris}{'\n'}
                {tissu.fournisseur} | Laize {tissu.laize_mm}mm | {tissu.grammage_g_m2}g/m²
              </Text>
              <Text style={s.tableCellRight}>{resultat.ml_total} ML</Text>
              <Text style={s.tableCellRight}>{tissu.prix_ml_ht.toFixed(2)} €</Text>
              <Text style={s.tableCellRight}>{montant.toFixed(2)} €</Text>
            </View>
          </View>

          <View style={{ ...s.separator, marginTop: 16 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <Text style={[s.text, s.bold]}>Total HT : {montant.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={s.h3}>Informations fournisseur</Text>
          <Text style={s.text}>Fournisseur : {tissu.fournisseur}</Text>
          <Text style={s.text}>Reference : {tissu.reference}</Text>
          <Text style={s.text}>Coloris : {tissu.coloris}</Text>
          <Text style={s.text}>Classification feu : {tissu.classification_feu}</Text>
          <Text style={s.text}>Delai : {tissu.delai_jours} jours</Text>
        </View>

        <Text style={s.footer}>
          ALS Confort — Stores Dublanc — Avenue de Bordeaux, 40800 Aire-sur-l&apos;Adour — SIRET 440 547 800 00019
        </Text>
      </Page>
    </Document>
  );
}
