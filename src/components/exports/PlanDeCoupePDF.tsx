"use client";

import { Document, Page, View, Text } from '@react-pdf/renderer';
import type { ResultatPatronage, Tissu } from '@/engine/types';
import { arrondirML } from '@/lib/constants';
import { pdfStyles as s } from '@/lib/pdf/styles';
import { Cartouche } from '@/lib/pdf/cartouche';

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  projetNom: string;
  client?: string;
}

export default function PlanDeCoupePDF({ resultat, tissu, projetNom, client }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Cartouche projetNom={projetNom} client={client} />

        <Text style={s.h1}>Plan de coupe</Text>

        {/* Résumé */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
          <View>
            <Text style={s.textSmall}>Tissu</Text>
            <Text style={s.text}>{tissu.reference} — {tissu.coloris}</Text>
          </View>
          <View>
            <Text style={s.textSmall}>Laize</Text>
            <Text style={s.text}>{tissu.laize_mm} mm</Text>
          </View>
          <View>
            <Text style={s.textSmall}>ML Total</Text>
            <Text style={[s.text, s.bold, s.blue]}>{resultat.ml_total} ML</Text>
          </View>
          <View>
            <Text style={s.textSmall}>Laizes</Text>
            <Text style={s.text}>{resultat.nombre_laizes}</Text>
          </View>
          <View>
            <Text style={s.textSmall}>Surface</Text>
            <Text style={s.text}>{resultat.surface_totale_m2} m²</Text>
          </View>
        </View>

        {/* Détail par panneau */}
        {resultat.panneaux.map((panneau) => {
          const mlPanneau = panneau.bandes.reduce(
            (acc, b) => acc + arrondirML(b.longueur_mm),
            0,
          );

          return (
            <View key={panneau.id} style={{ marginBottom: 12 }}>
              <Text style={s.h2}>
                {panneau.nom} — {panneau.bandes.length} laize{panneau.bandes.length > 1 ? 's' : ''} — {Math.round(mlPanneau * 100) / 100} ML
              </Text>

              {/* Table des bandes */}
              <View style={s.table}>
                <View style={s.tableHeader}>
                  <Text style={s.tableCell}>Bande</Text>
                  <Text style={s.tableCellRight}>Longueur (mm)</Text>
                  <Text style={s.tableCellRight}>Largeur eff. (mm)</Text>
                  <Text style={s.tableCellRight}>ML</Text>
                </View>
                {panneau.bandes.map((bande) => (
                  <View key={bande.id} style={s.tableRow}>
                    <Text style={s.tableCell}>B{bande.numero}</Text>
                    <Text style={s.tableCellRight}>{bande.longueur_mm}</Text>
                    <Text style={s.tableCellRight}>{bande.largeur_effective_mm}</Text>
                    <Text style={s.tableCellRight}>{arrondirML(bande.longueur_mm)}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={s.footer}>
          ALS Confort — Stores Dublanc — Avenue de Bordeaux, 40800 Aire-sur-l&apos;Adour — SIRET 440 547 800 00019
        </Text>
      </Page>
    </Document>
  );
}
