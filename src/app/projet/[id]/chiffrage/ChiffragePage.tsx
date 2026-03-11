"use client";

import { useCallback } from "react";
import { useProjetStore } from "@/stores/projet-store";
import { useTissusStore } from "@/stores/tissus-store";
import CoutDeRevient from "@/components/chiffrage/CoutDeRevient";
import type { Chiffrage } from "@/engine/types";

interface Props {
  projetId: string;
}

export default function ChiffragePage({ projetId }: Props) {
  const { projets, updateChiffrage } = useProjetStore();
  const { tissus } = useTissusStore();
  const projet = projets.find((p) => p.id === projetId);
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);
  const oeillets_config = projet
    ? (projet.params as { oeillets_config?: import("@/engine/types").OeilletConfig }).oeillets_config
    : undefined;

  const handleChiffrageChange = useCallback(
    (chiffrage: Chiffrage) => {
      updateChiffrage(projetId, chiffrage);
    },
    [projetId, updateChiffrage],
  );

  if (!projet?.resultat || !tissu) {
    return (
      <div className="p-6 text-muted-foreground">
        Renseignez les dimensions et le tissu pour acceder au chiffrage.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">
        Chiffrage — {projet.resultat.ml_total} ML de {tissu.reference}
      </h3>
      <CoutDeRevient
        resultat={projet.resultat}
        tissu={tissu}
        oeillets_config={oeillets_config}
        onChiffrageChange={handleChiffrageChange}
      />
    </div>
  );
}
