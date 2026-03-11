"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Mesh3D } from "@/engine/types";

const COTE_COLOR = "#1E40AF";

/** Ligne fine entre deux points */
function CoteLine({ start, end, dashed = false }: {
  start: [number, number, number];
  end: [number, number, number];
  dashed?: boolean;
}) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([...start, ...end], 3));
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color: COTE_COLOR, dashSize: 80, gapSize: 60 })
      : new THREE.LineBasicMaterial({ color: COTE_COLOR });
    const line = new THREE.Line(geo, mat);
    if (dashed) line.computeLineDistances();
    return line;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start[0], start[1], start[2], end[0], end[1], end[2], dashed]);

  return <primitive object={lineObj} />;
}

/** Petit trait perpendiculaire à l'extrémité d'une cote */
function CoteTickMark({ position, length, vertical }: {
  position: [number, number, number];
  length: number;
  vertical: boolean;
}) {
  const start: [number, number, number] = vertical
    ? [position[0] - length, position[1], position[2]]
    : [position[0], position[1] - length, position[2]];
  const end: [number, number, number] = vertical
    ? [position[0] + length, position[1], position[2]]
    : [position[0], position[1] + length, position[2]];

  return <CoteLine start={start} end={end} />;
}

interface CoteData {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset: [number, number, number];
}

function Cote({ start, end, label, offset }: CoteData) {
  const oStart: [number, number, number] = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const oEnd: [number, number, number] = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];

  const dy = end[1] - start[1];

  // Position du label au milieu de la cote
  const labelPos: [number, number, number] = [
    (oStart[0] + oEnd[0]) / 2,
    (oStart[1] + oEnd[1]) / 2,
    (oStart[2] + oEnd[2]) / 2,
  ];

  const hasOffset = offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0;
  const tickSize = Math.max(Math.sqrt(
    (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2 + (end[2] - start[2]) ** 2
  ) * 0.03, 80);

  return (
    <group>
      <CoteLine start={oStart} end={oEnd} />
      <CoteTickMark position={oStart} length={tickSize} vertical={dy !== 0} />
      <CoteTickMark position={oEnd} length={tickSize} vertical={dy !== 0} />

      {hasOffset && (
        <>
          <CoteLine start={start} end={oStart} dashed />
          <CoteLine start={end} end={oEnd} dashed />
        </>
      )}

      {/* Label HTML — taille fixe en pixels, lisible quel que soit le zoom */}
      <Html
        position={labelPos}
        center
        zIndexRange={[0, 10]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: COTE_COLOR,
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            userSelect: "none",
            border: `1px solid ${COTE_COLOR}33`,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

interface Props {
  mesh: Mesh3D;
}

export default function Cotation3D({ mesh }: Props) {
  const cotes = useMemo(() => {
    if (!mesh || mesh.vertices.length === 0) return [];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const v of mesh.vertices) {
      minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
      minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
      minZ = Math.min(minZ, v[2]); maxZ = Math.max(maxZ, v[2]);
    }

    const largeur = maxX - minX;
    const hauteur = maxY - minY;
    const profondeur = maxZ - minZ;
    const margin = Math.max(largeur, hauteur, profondeur) * 0.15;

    const result: CoteData[] = [];

    if (largeur > 0) {
      result.push({
        start: [minX, minY, minZ],
        end: [maxX, minY, minZ],
        label: `${Math.round(largeur)} mm`,
        offset: [0, 0, -margin],
      });
    }

    if (profondeur > 0) {
      result.push({
        start: [maxX, minY, minZ],
        end: [maxX, minY, maxZ],
        label: `${Math.round(profondeur)} mm`,
        offset: [margin, 0, 0],
      });
    }

    if (hauteur > 0) {
      result.push({
        start: [minX, minY, minZ],
        end: [minX, maxY, minZ],
        label: `${Math.round(hauteur)} mm`,
        offset: [-margin, 0, -margin * 0.5],
      });
    }

    return result;
  }, [mesh]);

  return (
    <group>
      {cotes.map((cote, i) => (
        <Cote key={i} {...cote} />
      ))}
    </group>
  );
}
