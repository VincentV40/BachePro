"use client";

import { useProjetStore } from "@/stores/projet-store";
import PanneauView from "@/components/plan-de-coupe/PanneauView";
import NestingView from "@/components/plan-de-coupe/NestingView";
import { useTissusStore } from "@/stores/tissus-store";

interface Props {
  projetId: string;
}

export default function PlanDeCoupePage({ projetId }: Props) {
  const { projets } = useProjetStore();
  const { tissus } = useTissusStore();
  const projet = projets.find((p) => p.id === projetId);
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);

  if (!projet?.resultat) {
    return (
      <div className="p-6 text-muted-foreground">
        Renseignez les dimensions dans l&apos;onglet Saisie pour voir le plan de coupe.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h3 className="text-lg font-semibold">Plan de coupe — {projet.resultat.ml_total} ML</h3>

      {/* Panneaux individuels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {projet.resultat.panneaux.map((panneau) => (
          <PanneauView key={panneau.id} panneau={panneau} />
        ))}
      </div>

      {/* Vue nesting sur rouleau */}
      {tissu && (
        <NestingView panneaux={projet.resultat.panneaux} laize_mm={tissu.laize_mm} />
      )}
    </div>
  );
}
