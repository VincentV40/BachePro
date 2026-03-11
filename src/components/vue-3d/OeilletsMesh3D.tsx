"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { Mesh3D, OeilletConfig } from "@/engine/types";
import { ESPACEMENT_DEFAUT, RETRAIT_DEFAUT } from "@/engine/geometry/oeillets";

interface Props {
  mesh: Mesh3D;
  config: OeilletConfig;
}

/** Calcule les positions 3D des œillets sur les arêtes extérieures du mesh */
function calculerPositionsOeillets3D(
  mesh: Mesh3D,
  config: OeilletConfig,
): THREE.Vector3[] {
  if (!config.actif || mesh.vertices.length === 0) return [];

  // Appliquer les valeurs par défaut — retrait 0 ou undefined → valeur réaliste
  const espacement = config.espacement_mm > 0 ? config.espacement_mm : ESPACEMENT_DEFAUT;
  const retrait = config.retrait_bord_mm > 0 ? config.retrait_bord_mm : RETRAIT_DEFAUT;
  const vertices = mesh.vertices;

  // Trouver les arêtes extérieures (apparaissant dans une seule face)
  // et mémoriser la face associée pour calculer la direction vers l'intérieur
  const edgeCount = new Map<string, number>();
  const edgeMap = new Map<string, [number, number]>();
  const edgeFaceMap = new Map<string, number>(); // clé arête → index face

  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const face = mesh.faces[fi]!;
    const idx = face.indices;
    const n = idx.length;
    for (let i = 0; i < n; i++) {
      const a = idx[i]!;
      const b = idx[(i + 1) % n]!;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
      if (!edgeMap.has(key)) edgeMap.set(key, [a, b]);
      if (!edgeFaceMap.has(key)) edgeFaceMap.set(key, fi);
    }
  }

  const exteriorEdges: [number, number][] = [];
  for (const [key, count] of edgeCount) {
    if (count === 1) {
      const edge = edgeMap.get(key);
      if (edge) exteriorEdges.push(edge);
    }
  }

  // Placer les œillets sur chaque arête extérieure
  // avec décalage perpendiculaire vers l'intérieur de la face (= retrait du bord)
  const positions: THREE.Vector3[] = [];

  for (const [ia, ib] of exteriorEdges) {
    const va = vertices[ia]!;
    const vb = vertices[ib]!;
    const vA = new THREE.Vector3(va[0], va[1], va[2]);
    const vB = new THREE.Vector3(vb[0], vb[1], vb[2]);

    const edgeDir = vB.clone().sub(vA);
    const len = edgeDir.length();
    if (len <= 2 * retrait) continue;
    edgeDir.normalize();

    // Calculer la direction perpendiculaire vers l'intérieur de la face
    const key = ia < ib ? `${ia}-${ib}` : `${ib}-${ia}`;
    const fi = edgeFaceMap.get(key) ?? 0;
    const face = mesh.faces[fi]!;
    const centroid = new THREE.Vector3();
    for (const vi of face.indices) {
      const v = vertices[vi]!;
      centroid.add(new THREE.Vector3(v[0], v[1], v[2]));
    }
    centroid.divideScalar(face.indices.length);
    const edgeMid = vA.clone().add(vB).multiplyScalar(0.5);
    const toCentroid = centroid.clone().sub(edgeMid);
    // Projeter hors de la direction de l'arête → purement perpendiculaire
    toCentroid.addScaledVector(edgeDir, -toCentroid.dot(edgeDir));
    if (toCentroid.length() < 0.001) continue;
    const inward = toCentroid.normalize();

    const start = retrait;
    const end = len - retrait;
    const count = Math.floor((end - start) / espacement) + 1;

    for (let j = 0; j < count; j++) {
      const t = start + j * espacement;
      if (t <= end + 0.01) {
        // Position sur l'arête + décalage perpendiculaire vers l'intérieur
        const pos = vA.clone()
          .addScaledVector(edgeDir, t)
          .addScaledVector(inward, retrait);
        positions.push(pos);
      }
    }
  }

  return positions;
}

const dummy = new THREE.Object3D();

export default function OeilletsMesh3D({ mesh, config }: Props) {
  const positions = useMemo(
    () => calculerPositionsOeillets3D(mesh, config),
    [mesh, config],
  );

  const r = (config.diametre_mm ?? 16) * 0.6; // rayon visuel légèrement plus grand

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(r, 8, 6), [r]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#A0A0A8", metalness: 0.7, roughness: 0.3 }),
    [],
  );

  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  useEffect(() => {
    const im = meshRef.current;
    if (!im) return;
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[sphereGeo, mat, positions.length]} />
  );
}
