import { ProposalCard, type ProposalData } from "./ProposalCard";

interface ProposalsListProps {
  proposals: ProposalData[];
  onAccept: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, front: string, back: string) => void;
}

export function ProposalsList({ proposals, onAccept, onRemove, onEdit }: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Brak propozycji do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32 sm:pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold">Propozycje fiszek ({proposals.length})</h3>
        <p className="text-sm text-muted-foreground">
          Zaakceptowano: {proposals.filter((p) => p.isAccepted).length} / {proposals.length}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} onAccept={onAccept} onRemove={onRemove} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
