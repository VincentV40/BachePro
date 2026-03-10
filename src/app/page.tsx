"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjetStore } from "@/stores/projet-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FolderOpen, Ruler, Calendar } from "lucide-react";
import type { TypologieBache } from "@/engine/types";

const TYPOLOGIES: { value: TypologieBache; label: string; icon: string }[] = [
  { value: "tente-deux-pans", label: "Tente deux pans", icon: "⛺" },
  { value: "mono-pente", label: "Mono-pente", icon: "📐" },
  { value: "rectangulaire-plate", label: "Rectangulaire plate", icon: "⬜" },
  { value: "trapezoidale", label: "Trapezoidale", icon: "⏢" },
  { value: "pagode", label: "Pagode", icon: "🏯" },
  { value: "tunnel", label: "Tunnel", icon: "🌀" },
  { value: "laterale-droite", label: "Laterale droite", icon: "▯" },
  { value: "forme-libre", label: "Forme libre", icon: "✏️" },
];

export default function Dashboard() {
  const router = useRouter();
  const { projets, creerProjet, supprimerProjet } = useProjetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newTypo, setNewTypo] = useState<TypologieBache>("tente-deux-pans");

  const handleCreer = () => {
    const nom = newNom.trim() || "Nouveau projet";
    const id = creerProjet(nom, newClient.trim(), newTypo);
    setDialogOpen(false);
    setNewNom("");
    setNewClient("");
    router.push(`/projet/${id}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Hero section */}
      <div className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Projets</h2>
            <p className="text-muted-foreground mt-1">
              {projets.length === 0
                ? "Aucun projet pour le moment"
                : `${projets.length} projet${projets.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={<Button size="lg" className="gap-2 shadow-md" />}
            >
              <Plus className="w-5 h-5" />
              Nouveau projet
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Creer un projet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom du projet</Label>
                    <Input
                      placeholder="Ex: LDC 32 Camping Gers"
                      value={newNom}
                      onChange={(e) => setNewNom(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label>Client</Label>
                    <Input
                      placeholder="Ex: Camping du Lac"
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Typologie</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPOLOGIES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setNewTypo(t.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${
                          newTypo === t.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreer} className="w-full" size="lg">
                  Creer le projet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {projets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Creez votre premier projet de bache pour commencer le patronage et le chiffrage.
          </p>
          <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Creer mon premier projet
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => {
            const typo = TYPOLOGIES.find((t) => t.value === projet.typologie);
            return (
              <Card
                key={projet.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 border-border/60"
                onClick={() => router.push(`/projet/${projet.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                        {typo?.icon ?? "📦"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate leading-tight">{projet.nom}</h3>
                        {projet.client && (
                          <p className="text-sm text-muted-foreground truncate">{projet.client}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        supprimerProjet(projet.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {typo?.label ?? projet.typologie}
                    </Badge>
                    {projet.resultat && (
                      <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/15 border-0">
                        <Ruler className="w-3 h-3 mr-1" />
                        {projet.resultat.ml_total} ML
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(projet.date_modification).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
