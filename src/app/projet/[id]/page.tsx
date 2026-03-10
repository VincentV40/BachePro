"use client";

import { useParams, useRouter } from "next/navigation";
import { useProjetStore } from "@/stores/projet-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PenLine, Scissors, Box, Calculator, FileDown, Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import SaisiePage from "./saisie/SaisiePage";
import PlanDeCoupePage from "./plan-de-coupe/PlanDeCoupePage";
import Vue3DPage from "./vue-3d/Vue3DPage";
import ChiffragePage from "./chiffrage/ChiffragePage";
import dynamic from "next/dynamic";

const ExportsPage = dynamic(() => import("./exports/ExportsPage"), { ssr: false });

const TYPO_ICONS: Record<string, string> = {
  "tente-deux-pans": "⛺",
  "mono-pente": "📐",
  "rectangulaire-plate": "⬜",
  "trapezoidale": "⏢",
  "pagode": "🏯",
  "tunnel": "🌀",
  "laterale-droite": "▯",
  "forme-libre": "✏️",
};

export default function ProjetPage() {
  const params = useParams();
  const router = useRouter();
  const { projets, setProjetActif } = useProjetStore();
  const [activeTab, setActiveTab] = useState("saisie");

  const projetId = params.id as string;
  const projet = projets.find((p) => p.id === projetId);

  useEffect(() => {
    if (projetId) {
      setProjetActif(projetId);
    }
    return () => setProjetActif(null);
  }, [projetId, setProjetActif]);

  if (!projet) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Projet introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* En-tete projet */}
      <div className="border-b bg-white px-6 py-3 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xl shrink-0">{TYPO_ICONS[projet.typologie] ?? "📦"}</span>
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{projet.nom}</h2>
            {projet.client && (
              <p className="text-xs text-muted-foreground truncate">{projet.client}</p>
            )}
          </div>
        </div>
        {projet.resultat && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-0 shrink-0 gap-1">
            <Ruler className="w-3 h-3" />
            {projet.resultat.ml_total} ML
          </Badge>
        )}
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-white px-4 h-auto py-0 gap-0">
          {[
            { value: "saisie", label: "Saisie", icon: PenLine },
            { value: "plan", label: "Plan de coupe", icon: Scissors },
            { value: "vue3d", label: "Vue 3D", icon: Box },
            { value: "chiffrage", label: "Chiffrage", icon: Calculator },
            { value: "export", label: "Export", icon: FileDown },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="saisie" className="flex-1 overflow-auto m-0">
          <SaisiePage projetId={projetId} />
        </TabsContent>

        <TabsContent value="plan" className="flex-1 overflow-auto m-0">
          <PlanDeCoupePage projetId={projetId} />
        </TabsContent>

        <TabsContent value="vue3d" className="flex-1 overflow-auto m-0">
          <Vue3DPage projetId={projetId} />
        </TabsContent>

        <TabsContent value="chiffrage" className="flex-1 overflow-auto m-0">
          <ChiffragePage projetId={projetId} />
        </TabsContent>

        <TabsContent value="export" className="flex-1 overflow-auto m-0">
          <ExportsPage projetId={projetId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
