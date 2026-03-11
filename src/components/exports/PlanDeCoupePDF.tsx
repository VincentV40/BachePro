"use client";

import {
  Document, Page, View, Text, Svg, Line, Polygon, Rect, StyleSheet,
} from '@react-pdf/renderer';
import type {
  ResultatPatronage, Tissu, Panneau, TypologieBache, TenteDeuxPansParams,
} from '@/engine/types';
import type { EntrepriseInfo } from '@/stores/parametres-store';
import { arrondirML } from '@/lib/constants';

// ============================================================
// TYPES
// ============================================================

interface Props {
  resultat: ResultatPatronage;
  tissu: Tissu;
  projetNom: string;
  client?: string;
  params?: TenteDeuxPansParams | null;
  typologie?: TypologieBache;
  entreprise?: EntrepriseInfo;
}

// ============================================================
// PROJECTION ISOMÉTRIQUE
// ============================================================

function isoProject(x: number, y: number, z: number): [number, number] {
  return [(x - z) * 0.866, -y + (x + z) * 0.5];
}

function computeTentIso(params: TenteDeuxPansParams, svgW: number, svgH: number, PAD: number) {
  const { largeur_base_mm: L, profondeur_mm: P, rampant_gauche_mm: Rg, rampant_droit_mm: Rd, hauteur_murs_mm: Hm } = params;
  const L2 = L / 2;
  const hg = Math.sqrt(Math.max(0, Rg ** 2 - L2 ** 2));
  const hd = Math.sqrt(Math.max(0, Rd ** 2 - L2 ** 2));
  const Hf = Hm + (hg + hd) / 2;

  const v3d: [number, number, number][] = [
    [-L2, 0, 0],   // 0
    [ L2, 0, 0],   // 1
    [ L2, 0, P],   // 2
    [-L2, 0, P],   // 3
    [-L2, Hm, 0],  // 4
    [ L2, Hm, 0],  // 5
    [ L2, Hm, P],  // 6
    [-L2, Hm, P],  // 7
    [  0, Hf, 0],  // 8 faîtage avant
    [  0, Hf, P],  // 9 faîtage arrière
  ];

  const iso = v3d.map(([x, y, z]) => isoProject(x, y, z));
  const xs = iso.map(p => p[0]);
  const ys = iso.map(p => p[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const scale = Math.min(
    (svgW - PAD * 2) / (xMax - xMin),
    (svgH - PAD * 2) / (yMax - yMin),
  ) * 0.88;

  const offX = PAD + ((svgW - PAD * 2) - (xMax - xMin) * scale) / 2;
  const offY = PAD + ((svgH - PAD * 2) - (yMax - yMin) * scale) / 2;

  const v = iso.map(([ix, iy]): [number, number] => [
    offX + (ix - xMin) * scale,
    offY + (iy - yMin) * scale,
  ]);

  return { v, Hf: Math.round(Hf), Hm, params };
}

// ============================================================
// COULEURS PANNEAUX
// ============================================================

const PANEL_COLORS: Record<string, string> = {
  versant: '#BFDBFE',
  'pignon-avant': '#FEF08A',
  'pignon-arriere': '#BBF7D0',
};
function getPanelColor(id: string) {
  if (id.startsWith('lambrequin')) return '#FED7AA';
  return PANEL_COLORS[id] ?? '#E5E7EB';
}

// ============================================================
// STYLES
// ============================================================

const s = StyleSheet.create({
  page: {
    padding: 14,
    flexDirection: 'column',
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
    paddingBottom: 4,
  },
  topTitle: { fontSize: 10, fontWeight: 'bold', color: '#1E40AF' },
  topSub: { fontSize: 7, color: '#6B7280' },
  mainRow: { flex: 1, flexDirection: 'row', gap: 8 },
  leftZone: { flex: 58, borderWidth: 0.5, borderColor: '#CBD5E1', padding: 4 },
  rightZone: { flex: 42, flexDirection: 'column', gap: 4 },
  sectionLabel: { fontSize: 6, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 2 },
  // Panneau mini
  panCard: { borderWidth: 0.5, borderColor: '#CBD5E1', padding: 4, flex: 1 },
  panHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  panTitle: { fontSize: 7, fontWeight: 'bold', color: '#1E40AF' },
  panBadge: { fontSize: 6, color: '#4B5563' },
  formula: { fontSize: 6, fontFamily: 'Courier', color: '#374151', marginTop: 2 },
  formulaBold: { fontSize: 6.5, fontFamily: 'Courier', fontWeight: 'bold', color: '#1E40AF' },
  // Annotations iso
  annots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  annotText: { fontSize: 6.5, color: '#1E40AF' },
  annotMuted: { fontSize: 6.5, color: '#9CA3AF' },
  annotGreen: { fontSize: 6.5, color: '#047857' },
  // Cartouche
  cartouche: { marginTop: 6, height: 62, flexDirection: 'row', borderWidth: 1, borderColor: '#374151' },
  cartLeft: { flex: 58, padding: 5, borderRightWidth: 0.5, borderRightColor: '#374151' },
  cartRight: { flex: 42, flexDirection: 'row' },
  cartLogoBox: { width: 72, backgroundColor: '#4B5563', alignItems: 'center', justifyContent: 'center', padding: 4 },
  cartCoords: { flex: 1, padding: 5, backgroundColor: '#F9FAFB' },
  cartTitle: { fontSize: 9, fontWeight: 'bold', color: '#1E40AF', marginBottom: 3 },
  cartRow: { flexDirection: 'row', gap: 16, marginBottom: 1 },
  cartLabel: { fontSize: 6, color: '#6B7280' },
  cartVal: { fontSize: 7, color: '#111827' },
  cartValBold: { fontSize: 7, color: '#111827', fontWeight: 'bold' },
  cartValBlue: { fontSize: 8, color: '#1E40AF', fontWeight: 'bold' },
  logoText: { color: 'white', fontWeight: 'bold', fontSize: 7, textAlign: 'center' },
  logoSub: { color: '#D1D5DB', fontSize: 4.5, textAlign: 'center', marginTop: 1 },
  logoBand: { backgroundColor: '#EAB308', width: '100%', alignItems: 'center', padding: 1.5, marginTop: 2 },
  logoBandTxt: { color: '#1F2937', fontSize: 5, fontWeight: 'bold' },
});

// ============================================================
// VUE ISOMÉTRIQUE
// ============================================================

function IsoView({ params, W, H }: { params: TenteDeuxPansParams; W: number; H: number }) {
  const { v, Hf, Hm, params: p } = computeTentIso(params, W, H, 16);
  const BLUE = '#1E40AF';

  const edges: [number, number, boolean][] = [
    [0, 1, false], [1, 2, false], [2, 3, false], [3, 0, true],
    [0, 4, true], [1, 5, false], [2, 6, false], [3, 7, true],
    [4, 5, false], [5, 6, false], [6, 7, true], [7, 4, true],
    [4, 8, false], [5, 8, false], [6, 9, false], [7, 9, true],
    [8, 9, false],
  ];

  const pt = (i: number) => v[i]!;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill="#FAFAFA" />

      {/* Faces teintées */}
      <Polygon
        points={[4, 7, 9, 8].map(i => `${pt(i)[0]},${pt(i)[1]}`).join(' ')}
        fill="#E0EDFF" stroke="none"
      />
      <Polygon
        points={[5, 6, 9, 8].map(i => `${pt(i)[0]},${pt(i)[1]}`).join(' ')}
        fill="#DBEAFE" stroke="none"
      />
      <Polygon
        points={[4, 5, 8].map(i => `${pt(i)[0]},${pt(i)[1]}`).join(' ')}
        fill="#FEF9C3" stroke="none"
      />

      {/* Arêtes */}
      {edges.map(([a, b, hidden], i) => (
        <Line
          key={i}
          x1={pt(a)[0]} y1={pt(a)[1]}
          x2={pt(b)[0]} y2={pt(b)[1]}
          stroke={BLUE}
          strokeWidth={hidden ? 0.5 : 1.1}
          strokeDasharray={hidden ? '2,2' : undefined}
          opacity={hidden ? 0.45 : 1}
        />
      ))}

      {/* Cote largeur : entre v0 et v1 */}
      {(()=>{
        const [ax, ay] = pt(0), [bx, by] = pt(1);
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        return (
          <>
            <Line x1={ax} y1={ay + 7} x2={bx} y2={by + 7} stroke={BLUE} strokeWidth={0.6} />
            <Line x1={ax} y1={ay} x2={ax} y2={ay + 9} stroke={BLUE} strokeWidth={0.5} />
            <Line x1={bx} y1={by} x2={bx} y2={by + 9} stroke={BLUE} strokeWidth={0.5} />
          </>
        );
      })()}

      {/* Cote profondeur : entre v1 et v2 */}
      {(()=>{
        const [ax, ay] = pt(1), [bx, by] = pt(2);
        return (
          <>
            <Line x1={ax + 7} y1={ay} x2={bx + 7} y2={by} stroke={BLUE} strokeWidth={0.6} />
            <Line x1={ax} y1={ay} x2={ax + 9} y2={ay} stroke={BLUE} strokeWidth={0.5} />
            <Line x1={bx} y1={by} x2={bx + 9} y2={by} stroke={BLUE} strokeWidth={0.5} />
          </>
        );
      })()}

      {/* Cote hauteur faîtage : entre v8 et la base */}
      {(()=>{
        const [fx, fy] = pt(8), [bx, by] = pt(1);
        return (
          <>
            <Line x1={fx + 10} y1={fy} x2={bx + 10} y2={by} stroke={BLUE} strokeWidth={0.6} />
            <Line x1={fx} y1={fy} x2={fx + 12} y2={fy} stroke={BLUE} strokeWidth={0.4} />
            <Line x1={bx} y1={by} x2={bx + 12} y2={by} stroke={BLUE} strokeWidth={0.4} />
          </>
        );
      })()}

      {/* Numéro [1] versant */}
      {(()=>{
        const cx = (pt(4)[0] + pt(5)[0] + pt(8)[0]) / 3;
        const cy = (pt(4)[1] + pt(5)[1] + pt(8)[1]) / 3;
        return (
          <>
            <Rect x={cx - 5} y={cy - 5} width={10} height={10} fill="white" stroke={BLUE} strokeWidth={0.7} rx={1.5} />
          </>
        );
      })()}
    </Svg>
  );
}

// ============================================================
// MINI-PANNEAU DÉPLIÉ
// ============================================================

function PanneauMiniPDF({ panneau }: { panneau: Panneau }) {
  const SW = 180, SH = 80;
  const PAD = 6;
  const fill = getPanelColor(panneau.id);

  const xs = panneau.vertices_2d.map(v => v[0]);
  const ys = panneau.vertices_2d.map(v => v[1]);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const bw = xMax - xMin, bh = yMax - yMin;

  // Rotation si portrait (comme PanneauView écran)
  const rotate = bh > bw * 1.5;
  const dW = rotate ? bh : bw;
  const dH = rotate ? bw : bh;
  const scale = Math.min((SW - PAD * 2) / dW, (SH - PAD * 2) / dH);

  const toSvg = (x: number, y: number): [number, number] =>
    rotate
      ? [PAD + y * scale, PAD + x * scale]
      : [PAD + (x - xMin) * scale, PAD + (yMax - y) * scale];

  const polygonPoints = panneau.vertices_2d.map(([x, y]) => toSvg(x, y).join(',')).join(' ');

  let cumX = xMin;
  const offsets: number[] = [];
  for (const b of panneau.bandes) { offsets.push(cumX); cumX += b.largeur_effective_mm; }

  const mlTotal = Math.round(panneau.bandes.reduce((a, b) => a + arrondirML(b.longueur_mm), 0) * 100) / 100;
  const n = panneau.bandes.length;
  const laize = panneau.bandes[0]!.largeur_effective_mm;
  const lng = panneau.bandes[0]?.longueur_mm ?? 0;

  return (
    <View style={s.panCard}>
      <View style={s.panHeader}>
        <Text style={s.panTitle}>{panneau.nom}</Text>
        <Text style={s.panBadge}>{n} laize{n > 1 ? 's' : ''} · {mlTotal} ML · {panneau.surface_m2} m²</Text>
      </View>

      <Svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}>
        <Polygon points={polygonPoints} fill={fill} stroke="none" />

        {/* Séparateurs de bandes */}
        {panneau.bandes.map((bande, i) => {
          if (i === 0) return null;
          if (rotate) {
            const [, sy] = toSvg(offsets[i]!, 0);
            return (
              <Line key={bande.id} x1={PAD} y1={sy} x2={PAD + dW * scale} y2={sy}
                stroke="#374151" strokeWidth={0.7} strokeDasharray="2,1" />
            );
          } else {
            const [sx] = toSvg(offsets[i]!, yMax);
            return (
              <Line key={bande.id} x1={sx} y1={PAD} x2={sx} y2={PAD + dH * scale}
                stroke="#374151" strokeWidth={0.7} strokeDasharray="2,1" />
            );
          }
        })}

        {/* Labels bandes */}
        {panneau.bandes.map((bande, i) => {
          let cx: number, cy: number;
          if (rotate) {
            const [, y0] = toSvg(offsets[i]!, 0);
            const bh_svg = bande.largeur_effective_mm * scale;
            cx = PAD + dW * scale / 2;
            cy = y0 + bh_svg / 2;
          } else {
            const [x0] = toSvg(offsets[i]!, yMax);
            const bw_svg = bande.largeur_effective_mm * scale;
            cx = x0 + bw_svg / 2;
            cy = PAD + dH * scale / 2;
          }
          return (
            <Line key={`lbl-${bande.id}`} x1={cx} y1={cy - 2} x2={cx} y2={cy + 2}
              stroke="#1E40AF" strokeWidth={0} />
          );
        })}

        <Polygon points={polygonPoints} fill="none" stroke="#374151" strokeWidth={0.8} />
      </Svg>

      <Text style={s.formula}>
        ({Math.round(bw)}/{laize}) → {n}×{arrondirML(lng).toFixed(2)}ML
      </Text>
      <Text style={s.formulaBold}>
        = {mlTotal} ML
      </Text>
    </View>
  );
}

// ============================================================
// CARTOUCHE BAS
// ============================================================

function CartoucheBas({ projetNom, client, tissu, mlTotal, date, entreprise }: {
  projetNom: string; client?: string; tissu: Tissu; mlTotal: number; date: string;
  entreprise?: EntrepriseInfo;
}) {
  const ent = entreprise;
  const nomEnt = ent?.nom ?? 'STORES DUBLANC';
  const adresse = ent ? `${ent.adresse} — ${ent.code_postal} ${ent.ville}` : "Avenue de Bordeaux — 40800 Aire sur l'Adour";
  const tel = ent?.tel ?? '';
  const siret = ent?.siret ?? '';

  return (
    <View style={s.cartouche}>
      {/* Bloc CLIENT */}
      <View style={s.cartLeft}>
        <Text style={s.cartTitle}>CLIENT</Text>
        <Text style={[s.cartVal, { fontWeight: 'bold', marginBottom: 2 }]}>
          {client ? `Projet de ${client}` : projetNom}
        </Text>
        <Text style={s.cartVal}>
          Tissu : {tissu.reference} — {tissu.coloris} ({tissu.fournisseur})
        </Text>
        <View style={s.cartRow}>
          <Text style={s.cartLabel}>Laize : {(tissu.laize_mm / 10).toFixed(0)} cm</Text>
          <Text style={s.cartLabel}>Grammage : {tissu.grammage_g_m2} g/m²</Text>
          <Text style={[s.cartValBlue]}>ML à commander : {mlTotal} ML</Text>
        </View>
        <View style={[s.cartRow, { marginTop: 2 }]}>
          <Text style={s.cartLabel}>Date : {date}</Text>
          <Text style={s.cartLabel}>Page 1/1</Text>
        </View>
      </View>

      {/* Bloc ENTREPRISE */}
      <View style={s.cartRight}>
        <View style={s.cartLogoBox}>
          <Text style={s.logoText}>STORES</Text>
          <Text style={s.logoText}>DUBLANC</Text>
          <View style={s.logoBand}>
            <Text style={s.logoBandTxt}>Artisan</Text>
          </View>
          <Text style={s.logoSub}>Fabricant · Installateur</Text>
        </View>
        <View style={s.cartCoords}>
          <Text style={[s.cartVal, { fontWeight: 'bold', marginBottom: 2 }]}>{nomEnt}</Text>
          <Text style={s.cartLabel}>{adresse}</Text>
          {tel ? <Text style={s.cartLabel}>Tél. {tel}</Text> : null}
          {siret ? <Text style={s.cartLabel}>SIRET : {siret}</Text> : null}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PlanDeCoupePDF({ resultat, tissu, projetNom, client, params, typologie, entreprise }: Props) {
  const date = new Date().toLocaleDateString('fr-FR');
  const isTent = typologie === 'tente-deux-pans' && params != null;

  // Dimensions SVG zone iso (A3 landscape ≈ 1190×840pt, zone gauche ≈ 650×710pt)
  const ISO_W = 640;
  const ISO_H = 680;

  return (
    <Document>
      <Page size="A3" orientation="landscape" style={s.page}>

        {/* Bandeau titre */}
        <View style={s.topBar}>
          <Text style={s.topTitle}>PLAN DE COUPE — {projetNom}</Text>
          <Text style={s.topSub}>
            {tissu.reference} {tissu.coloris} · Laize {tissu.laize_mm} mm · {resultat.ml_total} ML · {resultat.nombre_laizes} laizes · {resultat.surface_totale_m2} m²
          </Text>
        </View>

        {/* Zone principale */}
        <View style={s.mainRow}>

          {/* ─ Gauche : Vue isométrique ─ */}
          <View style={s.leftZone}>
            <Text style={s.sectionLabel}>Vue d'ensemble — structure montée</Text>

            {isTent ? (
              <IsoView params={params as TenteDeuxPansParams} W={ISO_W} H={ISO_H} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, color: '#9CA3AF' }}>
                  {resultat.surface_totale_m2} m² · {resultat.ml_total} ML
                </Text>
              </View>
            )}

            {/* Annotations cotations */}
            {isTent && (() => {
              const p = params as TenteDeuxPansParams;
              const L2 = p.largeur_base_mm / 2;
              const hg = Math.sqrt(Math.max(0, p.rampant_gauche_mm ** 2 - L2 ** 2));
              const hd = Math.sqrt(Math.max(0, p.rampant_droit_mm ** 2 - L2 ** 2));
              const Hf = Math.round(p.hauteur_murs_mm + (hg + hd) / 2);
              return (
                <View style={s.annots}>
                  <Text style={s.annotText}>↔ Largeur : {p.largeur_base_mm} mm</Text>
                  <Text style={s.annotText}>↔ Profondeur : {p.profondeur_mm} mm</Text>
                  <Text style={s.annotText}>↕ Faîtage : {Hf} mm</Text>
                  <Text style={s.annotText}>↕ Murs : {p.hauteur_murs_mm} mm</Text>
                  {p.lambrequin_gauche.actif
                    ? <Text style={s.annotGreen}>◀ Lambrequin G : L={p.lambrequin_gauche.longueur_mm}mm H={p.lambrequin_gauche.hauteur_mm}mm</Text>
                    : <Text style={s.annotMuted}>◀ Pas de lambrequin gauche</Text>}
                  {p.lambrequin_droit.actif
                    ? <Text style={s.annotGreen}>Lambrequin D : L={p.lambrequin_droit.longueur_mm}mm H={p.lambrequin_droit.hauteur_mm}mm ▶</Text>
                    : <Text style={s.annotMuted}>Pas de lambrequin droit ▶</Text>}
                </View>
              );
            })()}
          </View>

          {/* ─ Droite : Panneaux dépliés ─ */}
          <View style={s.rightZone}>
            <Text style={s.sectionLabel}>Panneaux dépliés — découpe laizes</Text>
            {resultat.panneaux.map(p => <PanneauMiniPDF key={p.id} panneau={p} />)}

            {/* Note lambrequin en chute */}
            {isTent && (() => {
              const p = params as TenteDeuxPansParams;
              if (p.lambrequin_droit.actif || p.lambrequin_gauche.actif) {
                return (
                  <View style={{ borderWidth: 0.5, borderColor: '#D97706', padding: 3, backgroundColor: '#FFFBEB', marginTop: 2 }}>
                    <Text style={{ fontSize: 5.5, color: '#92400E' }}>
                      ℹ Lambrequin : peut être découpé dans les chutes triangulaires des pignons. Vérifier avant commande supplémentaire.
                    </Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>
        </View>

        {/* Cartouche */}
        <CartoucheBas projetNom={projetNom} client={client} tissu={tissu} mlTotal={resultat.ml_total} date={date} entreprise={entreprise} />
      </Page>
    </Document>
  );
}
