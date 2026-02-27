import { useState } from "react";
import { SkipForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../lib/api";

interface Props {
  partyCode: string;
  participantId: string;
  hasSongs: boolean;
}

export default function HostControls({ partyCode, participantId, hasSongs }: Props) {
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    try {
      await api.nextSong(partyCode, participantId);
    } catch (err) {
      console.error("Failed to advance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleNext}
      disabled={loading || !hasSongs}
      className="bg-white text-black hover:bg-white/90 font-semibold gap-2"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <SkipForward size={16} />
      )}
      Next Song
    </Button>
  );
}
