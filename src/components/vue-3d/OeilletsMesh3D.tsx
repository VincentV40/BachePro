"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { Mesh3D, OeilletConfig } from "@/engine/types";

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

  const { espacement_mm, retrait_bord_mm } = config;
  const vertices = mesh.vertices;

  // Trouver les arêtes extérieures (apparaissant dans une seule face)
  const edgeCount = new Map<string, number>();
  const edgeMap = new Map<string, [number, number]>();

  for (const face of mesh.faces) {
    const idx = face.indices;
    const n = idx.length;
    for (let i = 0; i < n; i++) {
      const a = idx[i]!;
      const b = idx[(i + 1) % n]!;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
      if (!edgeMap.has(key)) edgeMap.set(key, [a, b]);
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
  const positions: THREE.Vector3[] = [];

  for (const [ia, ib] of exteriorEdges) {
    const va = vertices[ia]!;
    const vb = vertices[ib]!;

    const dx = vb[0] - va[0];
    const dy = vb[1] - va[1];
    const dz = vb[2] - va[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (len <= 2 * retrait_bord_mm) continue;

    const ux = dx / len;
    const uy = dy / len;
    const uz = dz / len;

    const start = retrait_bord_mm;
    const end = len - retrait_bord_mm;
    const count = Math.floor((end - start) / espacement_mm) + 1;

    for (let j = 0; j < count; j++) {
      const t = start + j * Math.min(espacement_mm, end - start);
      if (t <= end + 0.01) {
        positions.push(new THREE.Vector3(
          va[0] + ux * t,
          va[1] + uy * t,
          va[2] + uz * t,
        ));
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
