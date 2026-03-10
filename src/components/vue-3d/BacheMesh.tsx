"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Mesh3D } from "@/engine/types";

interface Props {
  mesh: Mesh3D;
}

export default function BacheMesh({ mesh }: Props) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    // Trianguler toutes les faces et construire le buffer
    const positions: number[] = [];
    const indices: number[] = [];

    // Copier les vertices
    for (const v of mesh.vertices) {
      positions.push(v[0], v[1], v[2]);
    }

    // Trianguler les faces (fan triangulation pour polygones convexes)
    for (const face of mesh.faces) {
      const idx = face.indices;
      const first = idx[0];
      if (first === undefined) continue;
      for (let i = 1; i < idx.length - 1; i++) {
        const a = idx[i];
        const b = idx[i + 1];
        if (a !== undefined && b !== undefined) {
          indices.push(first, a, b);
        }
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [mesh]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#e8d8b8"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#000000"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
