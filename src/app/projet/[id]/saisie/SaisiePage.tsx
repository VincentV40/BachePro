"use client";

import { useProjetStore } from "@/stores/projet-store";
import TenteDeuxPans from "@/components/saisie/TenteDeuxPans";
import MonoPente from "@/components/saisie/MonoPente";
import RectangulairePlate from "@/components/saisie/RectangulairePlate";
import Trapezoidale from "@/components/saisie/Trapezoidale";
import LateraleDroite from "@/components/saisie/LateraleDroite";
import Pagode from "@/components/saisie/Pagode";
import Tunnel from "@/components/saisie/Tunnel";
import FormeLibre from "@/components/saisie/FormeLibre";

interface Props {
  projetId: string;
}

export default function SaisiePage({ projetId }: Props) {
  const { projets } = useProjetStore();
  const projet = projets.find((p) => p.id === projetId);

  if (!projet) return null;

  switch (projet.typologie) {
    case "tente-deux-pans":
      return <TenteDeuxPans projetId={projetId} />;
    case "mono-pente":
      return <MonoPente projetId={projetId} />;
    case "rectangulaire-plate":
      return <RectangulairePlate projetId={projetId} />;
    case "trapezoidale":
      return <Trapezoidale projetId={projetId} />;
    case "laterale-droite":
      return <LateraleDroite projetId={projetId} />;
    case "pagode":
      return <Pagode projetId={projetId} />;
    case "tunnel":
      return <Tunnel projetId={projetId} />;
    case "forme-libre":
      return <FormeLibre projetId={projetId} />;
    default:
      return (
        <div className="p-6 text-muted-foreground">
          Formulaire pour &quot;{projet.typologie}&quot; non encore implemente.
        </div>
      );
  }
}
