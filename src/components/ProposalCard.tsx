import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, CheckCircle2 } from "lucide-react";

export interface ProposalData {
  id: string;
  front: string;
  back: string;
  isAccepted: boolean;
  isEdited: boolean;
}

interface ProposalCardProps {
  proposal: ProposalData;
  onAccept: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
}

export function ProposalCard({ proposal, onAccept, onRemove, onEdit }: ProposalCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedFront, setEditedFront] = useState(proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.back);

  const handleEditSubmit = () => {
    if (
      editedFront.trim().length > 0 &&
      editedBack.trim().length > 0 &&
      editedFront.trim().length <= 5000 &&
      editedBack.trim().length <= 5000
    ) {
      onEdit(proposal.id, editedFront.trim(), editedBack.trim());
      setIsDialogOpen(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      // Reset edited values when opening
      setEditedFront(proposal.front);
      setEditedBack(proposal.back);
    }
    setIsDialogOpen(open);
  };

  const isEditFormValid =
    editedFront.trim().length > 0 &&
    editedBack.trim().length > 0 &&
    editedFront.trim().length <= 5000 &&
    editedBack.trim().length <= 5000;

  return (
    <Card
      className={`relative transition-all flex flex-col h-full ${
        proposal.isAccepted ? "border-green-500/70 bg-green-950/30 shadow-md" : "border-border hover:shadow-sm"
      }`}
    >
      {proposal.isAccepted && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="h-5 w-5 text-green-400" aria-label="Zaakceptowano" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Przód</p>
            <p className="text-sm leading-relaxed">{proposal.front}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Tył</p>
          <p className="text-sm leading-relaxed">{proposal.back}</p>
        </div>
        {proposal.isEdited && <p className="text-xs text-amber-400 mt-2 italic">✎ Edytowano</p>}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3 mt-auto">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:flex-1" aria-label="Edytuj propozycję">
              <Pencil className="h-4 w-4 mr-1" />
              Edytuj
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Edytuj propozycję</DialogTitle>
              <DialogDescription>
                Wprowadź zmiany w treści fiszki. Zmiany zostaną zapisane po kliknięciu &quot;Zapisz zmiany&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-front" className="text-sm font-medium leading-none">
                  Przód fiszki
                </label>
                <Textarea
                  id="edit-front"
                  value={editedFront}
                  onChange={(e) => setEditedFront(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground text-right select-none">{editedFront.length} / 5000</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-back" className="text-sm font-medium leading-none">
                  Tył fiszki
                </label>
                <Textarea
                  id="edit-back"
                  value={editedBack}
                  onChange={(e) => setEditedBack(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground text-right select-none">{editedBack.length} / 5000</p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Anuluj
              </Button>
              <Button onClick={handleEditSubmit} disabled={!isEditFormValid} className="w-full sm:w-auto">
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2 w-full sm:flex-1">
          <Button
            variant={proposal.isAccepted ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => onAccept(proposal.id)}
            aria-label={proposal.isAccepted ? "Cofnij akceptację" : "Akceptuj propozycję"}
            aria-pressed={proposal.isAccepted}
          >
            <Check className="h-4 w-4 mr-1" />
            {proposal.isAccepted ? "Zaakceptowano" : "Akceptuj"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(proposal.id)}
            aria-label="Usuń propozycję"
            className="text-red-400 hover:bg-red-950/30 hover:border-red-500/50 px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
