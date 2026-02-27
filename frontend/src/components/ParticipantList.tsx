import { Users, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Participant } from "../hooks/useParty";

interface Props {
  participants: Participant[];
}

export default function ParticipantList({ participants }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="flex items-center gap-1.5 text-spotify-gray text-sm">
        <Users size={14} />
        <span>Listeners</span>
      </span>
      {participants.map((p) => (
        <Badge
          key={p.id}
          variant="secondary"
          className="flex items-center gap-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {p.isHost && <Crown size={12} className="text-spotify-green" />}
          {p.displayName}
        </Badge>
      ))}
    </div>
  );
}
