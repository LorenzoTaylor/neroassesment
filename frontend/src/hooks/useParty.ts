import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../lib/socket";
import { api } from "../lib/api";

export interface Participant {
  id: string;
  displayName: string;
  isHost: boolean;
}

export interface Song {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
  durationMs: number;
  queuePosition: number;
  playedAt?: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  status: "waiting" | "active" | "ended";
  maxSongs?: number;
  songsPerPerson?: number;
  participants: Participant[];
  songs: Song[];
}

// Returns the song that is currently playing — the one with the most recent playedAt.
// Using find() would return the first-ever played song, not the active one.
function findCurrentSong(songs: Song[], status: string): Song | null {
  if (status !== "active") return null;
  const played = songs.filter((s) => s.playedAt);
  if (played.length === 0) return null;
  return played.reduce((latest, s) =>
    new Date(s.playedAt!).getTime() > new Date(latest.playedAt!).getTime() ? s : latest
  );
}

export function useParty(partyCode: string | undefined, participantId: string | null) {
  const [party, setParty] = useState<Party | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playedSongs, setPlayedSongs] = useState<Song[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Song[] | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref so socket handlers always read the latest currentSong without stale closure
  const currentSongRef = useRef<Song | null>(null);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const loadParty = useCallback(async () => {
    if (!partyCode) return;
    try {
      const data = await api.getParty(partyCode);
      const p: Party = data.party;
      setParty(p);
      setParticipants(p.participants);
      const playing = findCurrentSong(p.songs, p.status);
      const unplayed = p.songs.filter((s) => !s.playedAt);
      const past = p.songs.filter((s) => s.playedAt && s.id !== playing?.id);
      setSongs(unplayed);
      setPlayedSongs(past);
      if (playing) {
        setCurrentSong(playing);
        setStartedAt(new Date(playing.playedAt!).getTime());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load party");
    } finally {
      setLoading(false);
    }
  }, [partyCode]);

  useEffect(() => {
    if (!partyCode || !participantId) {
      setLoading(false);
      return;
    }

    loadParty();

    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", { partyCode, participantId });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("party:state", ({ party: p }: { party: Party }) => {
      setParty(p);
      setParticipants(p.participants);
      const playing = findCurrentSong(p.songs, p.status);
      const unplayed = p.songs.filter((s) => !s.playedAt);
      const past = p.songs.filter((s) => s.playedAt && s.id !== playing?.id);
      setSongs(unplayed);
      setPlayedSongs(past);
      if (playing) {
        setCurrentSong(playing);
        setStartedAt(new Date(playing.playedAt!).getTime());
      }
    });

    socket.on("participant:joined", ({ participant }: { participant: Participant }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    });

    socket.on("participant:left", ({ participantId: leftId }: { participantId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== leftId));
    });

    socket.on("queue:updated", ({ songs: updatedSongs }: { songs: Song[] }) => {
      const unplayed = updatedSongs.filter((s) => !s.playedAt);
      setSongs(unplayed);
    });

    socket.on("song:playing", ({ song, startedAt: sa }: { song: Song; startedAt: number }) => {
      // Move the old "now playing" song into the past section
      const prev = currentSongRef.current;
      if (prev) {
        setPlayedSongs((past) => {
          if (past.find((s) => s.id === prev.id)) return past;
          return [...past, prev];
        });
      }
      setCurrentSong(song);
      setStartedAt(sa);
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
      setParty((prev) => prev ? { ...prev, status: "active" } : prev);
    });

    socket.on("party:ended", ({ songs: endSongs }: { songs: Song[] }) => {
      setWinners(endSongs);
      setParty((prev) => prev ? { ...prev, status: "ended" } : prev);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("party:state");
      socket.off("participant:joined");
      socket.off("participant:left");
      socket.off("queue:updated");
      socket.off("song:playing");
      socket.off("party:ended");
      socket.disconnect();
    };
  }, [partyCode, participantId, loadParty]);

  return {
    party,
    currentSong,
    songs,
    playedSongs,
    participants,
    winners,
    setWinners,
    startedAt,
    isConnected,
    loading,
    error,
    reload: loadParty,
  };
}
