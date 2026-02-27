import { useState, useRef } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { gsap } from "gsap";
import { Song } from "../hooks/useParty";
import { api } from "../lib/api";

interface Props {
  songs: Song[];
  playedSongs: Song[];
  participantId: string | null;
  partyStatus: string;
}

export default function Queue({ songs, playedSongs, participantId, partyStatus }: Props) {
  const [voted, setVoted] = useState<Record<string, 1 | -1>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({});

  const handleVote = async (songId: string, value: 1 | -1, btnEl: HTMLButtonElement | null) => {
    if (!participantId || voting[songId]) return;
    setVoting((v) => ({ ...v, [songId]: true }));

    if (btnEl) {
      gsap.fromTo(btnEl, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "elastic.out(1,0.5)" });
    }

    try {
      await api.castVote(songId, participantId, value);
      setVoted((v) => ({ ...v, [songId]: value }));
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVoting((v) => ({ ...v, [songId]: false }));
    }
  };

  const VoteButtons = ({ song }: { song: Song }) => {
    const upRef = useRef<HTMLButtonElement>(null);
    const downRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          ref={upRef}
          onClick={() => handleVote(song.id, 1, upRef.current)}
          disabled={voting[song.id]}
          className={`p-1.5 rounded-lg transition-colors ${
            voted[song.id] === 1
              ? "text-spotify-green bg-spotify-green/10"
              : "text-spotify-gray hover:text-white hover:bg-white/10"
          } disabled:cursor-not-allowed`}
          title="Upvote"
        >
          <ThumbsUp size={15} />
        </button>
        <button
          ref={downRef}
          onClick={() => handleVote(song.id, -1, downRef.current)}
          disabled={voting[song.id]}
          className={`p-1.5 rounded-lg transition-colors ${
            voted[song.id] === -1
              ? "text-red-400 bg-red-400/10"
              : "text-spotify-gray hover:text-white hover:bg-white/10"
          } disabled:cursor-not-allowed`}
          title="Downvote"
        >
          <ThumbsDown size={15} />
        </button>
      </div>
    );
  };

  if (songs.length === 0 && playedSongs.length === 0) {
    return (
      <div className="text-spotify-gray text-center py-8">
        <p className="text-sm">No songs in queue</p>
        <p className="text-xs mt-1 opacity-60">Add a song to get started!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="space-y-0.5 pr-1">
        {songs.length === 0 && (
          <p className="text-spotify-gray text-xs text-center py-4 opacity-60">No more songs queued</p>
        )}

        {songs.map((song, i) => (
          <QueueRow key={song.id} song={song} position={i + 1} showVotes={partyStatus !== "ended"}>
            <VoteButtons song={song} />
          </QueueRow>
        ))}

        {playedSongs.length > 0 && partyStatus !== "ended" && (
          <>
            <div className="pt-4 pb-2 flex items-center gap-3">
              <Separator className="flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-widest text-spotify-gray/60 flex-shrink-0">
                Played
              </span>
              <Separator className="flex-1 bg-white/10" />
            </div>
            {playedSongs.map((song) => (
              <PlayedRow key={song.id} song={song}>
                <VoteButtons song={song} />
              </PlayedRow>
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function QueueRow({
  song,
  position,
  showVotes,
  children,
}: {
  song: Song;
  position: number;
  showVotes: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-150 group">
      <span className="text-xs text-spotify-gray w-5 text-right font-mono flex-shrink-0">{position}</span>
      {song.albumArt ? (
        <img src={song.albumArt} alt={song.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{song.title}</p>
        <p className="text-spotify-gray text-xs truncate">{song.artist}</p>
      </div>
      {showVotes && children}
    </div>
  );
}

function PlayedRow({ song, children }: { song: Song; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50 hover:opacity-70 transition-all duration-150">
      <span className="text-xs text-spotify-gray w-5 text-right flex-shrink-0">
        <Check size={13} />
      </span>
      {song.albumArt ? (
        <img src={song.albumArt} alt={song.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 grayscale" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/10 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{song.title}</p>
        <p className="text-spotify-gray text-xs truncate">{song.artist}</p>
      </div>
      {children}
    </div>
  );
}
