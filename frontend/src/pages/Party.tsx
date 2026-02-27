import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Headphones, Users, ListMusic, Plus, LogOut, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { useParty } from "../hooks/useParty";
import { useSpotify } from "../hooks/useSpotify";
import { api } from "../lib/api";
import NowPlaying from "../components/NowPlaying";
import Queue from "../components/Queue";
import SearchModal from "../components/SearchModal";
import ParticipantList from "../components/ParticipantList";
import HostControls from "../components/HostControls";
import WinnerReveal from "../components/WinnerReveal";

export default function Party() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [songsAddedCount, setSongsAddedCount] = useState(0);
  const [endingParty, setEndingParty] = useState(false);
  const [endPartyError, setEndPartyError] = useState("");

  useEffect(() => {
    setParticipantId(localStorage.getItem("nero_participantId"));
    setIsSpectator(localStorage.getItem("nero_isSpectator") === "true");
  }, []);

  const { party, currentSong, songs, playedSongs, participants, winners, setWinners, startedAt, loading, error } =
    useParty(code, participantId);
  const { isSpotifyConnected, connectSpotify, playTrack } = useSpotify();

  // Play track when current song changes
  useEffect(() => {
    if (currentSong && isSpotifyConnected && startedAt) {
      const offset = Math.max(0, Date.now() - startedAt);
      playTrack(currentSong.spotifyId, offset);
    }
  }, [currentSong?.id, isSpotifyConnected]);

  // Auto-advance: host's client fires next song when duration elapses
  useEffect(() => {
    if (!currentSong || !startedAt || !party) return;
    const myParticipant = participants.find((p) => p.id === participantId);
    if (!myParticipant?.isHost) return;

    const remaining = currentSong.durationMs - (Date.now() - startedAt);
    if (remaining <= 0) return;

    const timer = setTimeout(async () => {
      try {
        const result = await api.nextSong(code!, participantId!);
        // If songs ran out, backend now returns scored songs — use them as fallback
        if (result.ended && result.songs) {
          setWinners(result.songs);
        }
      } catch {}
    }, remaining);

    return () => clearTimeout(timer);
  }, [currentSong?.id, startedAt]);

  const handleEndParty = async () => {
    if (!code || !participantId || endingParty) return;
    setEndingParty(true);
    setEndPartyError("");
    try {
      const data = await api.endParty(code, participantId);
      // Socket party:ended will also fire and set winners — this is a fallback
      if (data.songs) {
        setWinners(data.songs);
      }
    } catch (err) {
      console.error("Failed to end party:", err);
      setEndPartyError(err instanceof Error ? err.message : "Failed to end party");
    } finally {
      setEndingParty(false);
    }
  };

  const myParticipant = participants.find((p) => p.id === participantId);
  const isHost = myParticipant?.isHost ?? false;
  const regularCount = participants.filter((p) => !p.isSpectator).length;
  const spectatorCount = participants.filter((p) => p.isSpectator).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <p className="text-spotify-gray">Loading party...</p>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Party not found"}</p>
          <button onClick={() => navigate("/")} className="text-spotify-green hover:underline">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spotify-black flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-md bg-spotify-black/80 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Headphones size={20} className="text-spotify-green" />
          <span className="text-white font-semibold text-base">{party.name}</span>
          <Badge
            variant="outline"
            className="font-mono text-spotify-green border-spotify-green/40 text-xs tracking-widest"
          >
            {party.code}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-spotify-gray text-sm">
            <Users size={14} />
            {regularCount}
          </span>
          {spectatorCount > 0 && (
            <span className="flex items-center gap-1.5 text-spotify-gray text-sm">
              <Eye size={14} />
              {spectatorCount}
            </span>
          )}
          {isSpectator && (
            <Badge variant="outline" className="text-xs border-white/20 text-white/50">
              Spectator
            </Badge>
          )}
          {!isSpotifyConnected && (
            <Button
              size="sm"
              onClick={connectSpotify}
              className="bg-spotify-green text-black hover:bg-spotify-green/90 font-semibold text-xs rounded-full h-8"
            >
              Connect Spotify
            </Button>
          )}
          {endPartyError && (
            <span className="text-red-400 text-xs">{endPartyError}</span>
          )}
          {isHost && !winners && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndParty}
              disabled={endingParty}
              className="text-xs rounded-full h-8 gap-1.5"
            >
              {endingParty ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {endingParty ? "Ending..." : "End Party"}
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
        {/* Left: Now Playing */}
        <div className="p-6 border-r border-white/10">
          <BlurFade delay={0.1} inView>
            <h2 className="text-spotify-gray text-xs font-bold uppercase tracking-widest mb-4">
              Now Playing
            </h2>
            <NowPlaying song={currentSong} startedAt={startedAt} isSpotifyConnected={isSpotifyConnected} />
            {isHost && (
              <div className="mt-6 flex justify-center">
                <HostControls partyCode={code!} participantId={participantId!} hasSongs={songs.length > 0} />
              </div>
            )}
          </BlurFade>
        </div>

        {/* Right: Queue */}
        <div className="p-6 flex flex-col">
          <BlurFade delay={0.2} inView className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-1.5 text-spotify-gray text-xs font-bold uppercase tracking-widest">
                <ListMusic size={14} />
                Up Next
              </h2>
              {!isSpectator && (
                <Button
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="bg-spotify-green text-black hover:bg-spotify-green/90 font-semibold text-xs rounded-full h-8 gap-1.5"
                >
                  <Plus size={14} />
                  Add Song
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <Queue songs={songs} playedSongs={playedSongs} participantId={participantId} partyStatus={party.status} />
            </div>
          </BlurFade>
        </div>
      </main>

      {/* Footer: Participant list */}
      <footer className="bg-spotify-dark border-t border-white/10 px-4 py-3">
        <ParticipantList participants={participants} />
      </footer>

      {/* Modals */}
      {showSearch && participantId && (
        <SearchModal
          partyCode={code!}
          participantId={participantId}
          songsPerPerson={party?.songsPerPerson}
          songsAlreadyAdded={songsAddedCount}
          onClose={() => setShowSearch(false)}
          onAdded={() => setSongsAddedCount((n) => n + 1)}
        />
      )}

      {winners !== null && <WinnerReveal songs={winners} />}
    </div>
  );
}
