import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  h3: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
  },
  textSmall: {
    fontSize: 8,
    color: '#666',
  },
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d4d4d8',
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  blue: {
    color: '#1E40AF',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
});
