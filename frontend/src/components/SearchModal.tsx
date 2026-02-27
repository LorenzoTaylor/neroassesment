import { useState, useEffect, useRef } from "react";
import { Search, Plus, Music, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api, SongData } from "../lib/api";

interface Props {
  partyCode: string;
  participantId: string;
  songsPerPerson?: number;
  songsAlreadyAdded?: number;
  onClose: () => void;
  onAdded: () => void;
}

interface Track {
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
  durationMs: number;
}

export default function SearchModal({
  partyCode,
  participantId,
  songsPerPerson,
  songsAlreadyAdded = 0,
  onClose,
  onAdded,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remaining = songsPerPerson != null ? songsPerPerson - songsAlreadyAdded : null;
  const atLimit = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchSpotify(query.trim());
        setResults(data.tracks);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleAdd = async (track: Track) => {
    if (atLimit) return;
    setAdding(track.spotifyId);
    setError("");
    try {
      await api.addSong(partyCode, participantId, track as SongData);
      // Stay open — just reset search so they can add another
      setQuery("");
      setResults([]);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song");
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-spotify-dark border-white/10 max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-white font-semibold text-base">Add a Song</DialogTitle>
            {remaining !== null && (
              <Badge
                variant="outline"
                className={`text-xs font-mono tabular-nums ${
                  remaining <= 0
                    ? "border-red-500/40 text-red-400"
                    : "border-spotify-green/40 text-spotify-green"
                }`}
              >
                {remaining <= 0 ? "Limit reached" : `${remaining} left`}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-gray pointer-events-none" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a song..."
              disabled={atLimit}
              className="pl-9 bg-[#333] border-white/20 text-white placeholder:text-white/40 focus-visible:ring-spotify-green focus-visible:border-spotify-green disabled:opacity-50"
            />
          </div>
          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          {atLimit && (
            <p className="mt-2 text-spotify-gray text-sm text-center">
              You've reached your song limit for this party.
            </p>
          )}
        </div>

        <div className="px-5 pb-5 max-h-80 overflow-y-auto scrollbar-thin space-y-1">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4 bg-white/10" />
                    <Skeleton className="h-3 w-1/2 bg-white/10" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <div className="flex flex-col items-center py-8 gap-2 text-spotify-gray">
              <Music size={32} className="opacity-40" />
              <p className="text-sm">No results found</p>
            </div>
          )}

          {!loading && results.map((track) => (
            <div
              key={track.spotifyId}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              {track.albumArt ? (
                <img src={track.albumArt} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{track.title}</p>
                <p className="text-spotify-gray text-xs truncate">{track.artist}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAdd(track)}
                disabled={adding === track.spotifyId || atLimit}
                className="h-8 w-8 p-0 text-spotify-gray hover:text-white hover:bg-white/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {adding === track.spotifyId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
