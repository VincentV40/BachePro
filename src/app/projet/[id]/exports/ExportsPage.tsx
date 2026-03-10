"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useProjetStore } from "@/stores/projet-store";
import { useTissusStore } from "@/stores/tissus-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import PlanDeCoupePDF from "@/components/exports/PlanDeCoupePDF";
import BonDeCommandePDF from "@/components/exports/BonDeCommandePDF";
import DevisClientPDF from "@/components/exports/DevisClientPDF";

interface Props {
  projetId: string;
}

export default function ExportsPage({ projetId }: Props) {
  const { projets } = useProjetStore();
  const { tissus } = useTissusStore();
  const projet = projets.find((p) => p.id === projetId);
  const tissu = tissus.find((t) => t.id === projet?.tissu_id);
  const [loading, setLoading] = useState<string | null>(null);

  if (!projet?.resultat || !tissu) {
    return (
      <div className="p-6 text-muted-foreground">
        Completez la saisie pour generer les exports.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const download = async (name: string, doc: React.ReactElement<any>) => {
    setLoading(name);
    try {
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projet.nom.replace(/\s+/g, "_")}_${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  const exports = [
    {
      name: "plan_de_coupe",
      label: "Plan de coupe",
      description: "Panneaux, bandes, dimensions et ML par laize",
      doc: (
        <PlanDeCoupePDF
          resultat={projet.resultat}
          tissu={tissu}
          projetNom={projet.nom}
          client={projet.client}
        />
      ),
    },
    {
      name: "bon_commande",
      label: "Bon de commande tissu",
      description: "Reference tissu, metrage, fournisseur, prix",
      doc: (
        <BonDeCommandePDF
          resultat={projet.resultat}
          tissu={tissu}
          projetNom={projet.nom}
          client={projet.client}
        />
      ),
    },
    ...(projet.chiffrage
      ? [
          {
            name: "devis_client",
            label: "Devis client",
            description: "Prix TTC, conditions, signature",
            doc: (
              <DevisClientPDF
                chiffrage={projet.chiffrage}
                projetNom={projet.nom}
                client={projet.client}
                resultat={projet.resultat}
                tissu={tissu}
                typologie={projet.typologie}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h3 className="text-lg font-semibold">Exports PDF</h3>
      {exports.map((exp) => (
        <Card key={exp.name}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{exp.label}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{exp.description}</p>
            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => download(exp.name, exp.doc)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {loading === exp.name ? "Generation..." : "Telecharger"}
            </Button>
          </CardContent>
        </Card>
      ))}

      {!projet.chiffrage && (
        <p className="text-sm text-muted-foreground">
          Completez l&apos;onglet Chiffrage pour generer le devis client.
        </p>
      )}
    </div>
  );
}
