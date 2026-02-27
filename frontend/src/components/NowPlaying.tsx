import { useEffect, useRef, useState } from "react";
import { Music2, Radio } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { gsap } from "gsap";
import { Song } from "../hooks/useParty";

interface Props {
  song: Song | null;
  startedAt: number | null;
  isSpotifyConnected: boolean;
}

export default function NowPlaying({ song, startedAt, isSpotifyConnected }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevSongId = useRef<string | null>(null);

  // Progress tracking
  useEffect(() => {
    if (!song || !startedAt) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min((elapsed / song.durationMs) * 100, 100);
      setProgress(pct);
    }, 500);
    return () => clearInterval(interval);
  }, [song, startedAt]);

  // GSAP song transition
  useEffect(() => {
    if (!cardRef.current || !song) return;
    if (prevSongId.current === song.id) return;

    const card = cardRef.current;
    if (prevSongId.current !== null) {
      // Transition out then in
      gsap.to(card, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        onComplete: () => {
          prevSongId.current = song.id;
          gsap.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        },
      });
    } else {
      prevSongId.current = song.id;
      gsap.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  }, [song?.id]);

  // Preview audio
  useEffect(() => {
    if (!song?.previewUrl || !audioRef.current || isSpotifyConnected) return;
    if (!startedAt) return;
    const offset = (Date.now() - startedAt) / 1000;
    audioRef.current.src = song.previewUrl;
    audioRef.current.currentTime = Math.min(offset, 30);
    audioRef.current.play().catch(() => {});
  }, [song, startedAt, isSpotifyConnected]);

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-spotify-gray gap-3">
        <Music2 size={48} className="opacity-40" />
        <p className="text-base">Waiting for host to start...</p>
      </div>
    );
  }

  const elapsed = startedAt ? Math.min(Date.now() - startedAt, song.durationMs) : 0;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div
      ref={cardRef}
      className="relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden"
    >
      <BorderBeam size={300} duration={10} colorFrom="#1DB954" colorTo="#ffffff22" />

      <div className="flex flex-col items-center gap-4">
        {/* Album art with glow */}
        <div className="relative">
          {song.albumArt && (
            <>
              {/* Glow layer */}
              <div
                className="absolute inset-0 rounded-xl animate-glow-pulse"
                style={{
                  background: `radial-gradient(ellipse at center, #1DB95440 0%, transparent 70%)`,
                  filter: "blur(20px)",
                  transform: "scale(1.1)",
                }}
              />
              <img
                src={song.albumArt}
                alt={song.title}
                className="relative w-48 h-48 md:w-56 md:h-56 object-cover rounded-xl shadow-2xl ring-2 ring-spotify-green/20"
              />
            </>
          )}
        </div>

        {/* Song info */}
        <div className="text-center w-full">
          <h2 className="text-lg font-bold text-white truncate">{song.title}</h2>
          <p className="text-spotify-gray text-sm truncate mt-0.5">{song.artist}</p>
        </div>

        {/* Progress */}
        <div className="w-full space-y-1.5">
          <Progress
            value={progress}
            className="h-1 bg-white/10 [&>div]:bg-spotify-green"
          />
          <div className="flex justify-between text-spotify-gray text-xs">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(song.durationMs)}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isSpotifyConnected ? (
            <Badge variant="outline" className="border-spotify-green/40 text-spotify-green gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-spotify-green animate-pulse" />
              Playing on Spotify
            </Badge>
          ) : song.previewUrl ? (
            <Badge variant="outline" className="border-white/20 text-spotify-gray gap-1.5 text-xs">
              <Radio size={12} />
              Preview 30s
            </Badge>
          ) : null}
        </div>
      </div>

      {!isSpotifyConnected && song.previewUrl && <audio ref={audioRef} hidden />}
    </div>
  );
}
