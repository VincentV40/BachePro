import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { createElement } from 'react';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
    paddingBottom: 10,
    marginBottom: 20,
  },
  company: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  projectInfo: {
    textAlign: 'right',
  },
  projectName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
});

interface CartoucheProps {
  projetNom: string;
  client?: string;
  date?: string;
}

export function Cartouche({ projetNom, client, date }: CartoucheProps) {
  return createElement(View, { style: styles.container },
    createElement(View, null,
      createElement(Text, { style: styles.company }, 'STORES DUBLANC'),
      createElement(Text, { style: styles.info }, 'ALS Confort — SARL'),
      createElement(Text, { style: styles.info }, 'Avenue de Bordeaux, 40800 Aire-sur-l\'Adour'),
      createElement(Text, { style: styles.info }, 'SIRET : 440 547 800 00019'),
    ),
    createElement(View, { style: styles.projectInfo },
      createElement(Text, { style: styles.projectName }, projetNom),
      client ? createElement(Text, { style: styles.info }, client) : null,
      createElement(Text, { style: styles.date }, date ?? new Date().toLocaleDateString('fr-FR')),
    ),
  );
}
