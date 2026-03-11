"use client";

import { useMemo, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { TypologieBache, Projet, Mesh3D } from "@/engine/types";
import { genererGeometrie as geoTenteDeuxPans } from "@/engine/typologies/tente-deux-pans";
import { genererGeometrie as geoMonoPente } from "@/engine/typologies/mono-pente";
import { genererGeometrie as geoRectangulairePlate } from "@/engine/typologies/rectangulaire-plate";
import { genererGeometrie as geoTrapezoidale } from "@/engine/typologies/trapezoidale";
import { genererGeometrie as geoPagode } from "@/engine/typologies/pagode";
import { genererGeometrie as geoTunnel } from "@/engine/typologies/tunnel";
import { genererGeometrie as geoLateraleDroite } from "@/engine/typologies/laterale-droite";
import { genererGeometrie as geoFormeLibre } from "@/engine/typologies/forme-libre";
import BacheMesh from "./BacheMesh";
import Cotation3D from "./Cotation3D";
import OeilletsMesh3D from "./OeilletsMesh3D";
import type { OeilletConfig } from "@/engine/types";

interface Props {
  typologie: TypologieBache;
  params: Projet["params"];
}

function genererMesh(typologie: TypologieBache, params: Projet["params"]): Mesh3D | null {
  try {
    switch (typologie) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "tente-deux-pans": return geoTenteDeuxPans(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "mono-pente": return geoMonoPente(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "rectangulaire-plate": return geoRectangulairePlate(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "trapezoidale": return geoTrapezoidale(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "pagode": return geoPagode(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "tunnel": return geoTunnel(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "laterale-droite": return geoLateraleDroite(params as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "forme-libre": return geoFormeLibre(params as any);
      default: return null;
    }
  } catch {
    return null;
  }
}

export default function BacheScene({ typologie, params }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const mesh = useMemo(() => genererMesh(typologie, params), [typologie, params]);

  const maxDim = useMemo(() => {
    if (!mesh || mesh.vertices.length === 0) return 10000;
    let max = 0;
    for (const v of mesh.vertices) {
      max = Math.max(max, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
    }
    return max || 10000;
  }, [mesh]);

  const cameraDistance = maxDim * 1.5;

  const handleReset = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{
          position: [cameraDistance * 0.6, cameraDistance * 0.4, cameraDistance * 0.6],
          fov: 50,
          near: 10,
          far: maxDim * 10,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#F5F5F5");
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 2, 1]} intensity={0.8} />

        {mesh && (
          <>
            <BacheMesh mesh={mesh} />
            <Cotation3D mesh={mesh} />
            {(params as { oeillets_config?: OeilletConfig }).oeillets_config?.actif && (
              <OeilletsMesh3D
                mesh={mesh}
                config={(params as { oeillets_config: OeilletConfig }).oeillets_config}
              />
            )}
          </>
        )}

        <Grid
          args={[maxDim * 3, maxDim * 3]}
          cellSize={500}
          sectionSize={1000}
          fadeDistance={maxDim * 3}
          cellColor="#d4d4d8"
          sectionColor="#a1a1aa"
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={maxDim * 0.3}
          maxDistance={maxDim * 5}
        />
      </Canvas>

      {/* Bouton reset vue — overlay HTML */}
      <button
        onClick={handleReset}
        className="absolute bottom-3 right-3 px-2.5 py-1.5 text-xs font-medium bg-white/90 hover:bg-white border border-gray-200 rounded shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
        title="Réinitialiser la vue"
      >
        Reset vue
      </button>
    </div>
  );
}
