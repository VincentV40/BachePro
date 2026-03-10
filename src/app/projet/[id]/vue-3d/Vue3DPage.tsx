"use client";

import dynamic from "next/dynamic";
import { useProjetStore } from "@/stores/projet-store";

const BacheScene = dynamic(() => import("@/components/vue-3d/BacheScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Chargement de la scene 3D...
    </div>
  ),
});

interface Props {
  projetId: string;
}

export default function Vue3DPage({ projetId }: Props) {
  const { projets } = useProjetStore();
  const projet = projets.find((p) => p.id === projetId);

  if (!projet) return null;

  return (
    <div className="h-full min-h-[500px]">
      <BacheScene
        typologie={projet.typologie}
        params={projet.params}
      />
    </div>
  );
}
