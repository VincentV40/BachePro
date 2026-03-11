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

  const { resultat } = projet;
  // Récupérer la config œillets depuis les params du projet (tente deux pans)
  const oeillets_config = (projet.params as { oeillets_config?: import("@/engine/types").OeilletConfig }).oeillets_config;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Plan de coupe</h3>
        <div className="text-sm text-muted-foreground flex gap-3 flex-wrap">
          <span>{resultat.ml_total} ML</span>
          <span>{resultat.nombre_laizes} laizes</span>
          <span>{resultat.surface_totale_m2} m²</span>
          {resultat.taux_chute_pct > 0 && <span>chute {resultat.taux_chute_pct} %</span>}
          {resultat.nb_oeillets !== undefined && <span>{resultat.nb_oeillets} œillets</span>}
        </div>
      </div>

      {/* Panneaux individuels — pleine largeur */}
      <div className="flex flex-col gap-8">
        {resultat.panneaux.map((panneau) => (
          <PanneauView key={panneau.id} panneau={panneau} oeillets_config={oeillets_config} />
        ))}
      </div>

      {/* Vue nesting sur rouleau */}
      {tissu ? (
        <NestingView
          panneaux={resultat.panneaux}
          laize_mm={tissu.laize_mm}
          tissu={tissu}
        />
      ) : (
        <NestingView panneaux={resultat.panneaux} laize_mm={2670} />
      )}
    </div>
  );
}
