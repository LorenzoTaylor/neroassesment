import { useLayoutEffect, useRef } from "react";
import { Trophy, Medal, Hash, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { gsap } from "gsap";
import { Song } from "../hooks/useParty";
import { useNavigate } from "react-router-dom";

interface Props {
  songs: Song[];
}

export default function WinnerReveal({ songs }: Props) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const winnerCardRef = useRef<HTMLDivElement>(null);
  const restListRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect runs before paint — avoids GSAP flash-of-invisible-content
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Fade in the content area (not the overlay — overlay is always opaque)
      if (contentRef.current) {
        tl.from(contentRef.current, { opacity: 0, y: 10, duration: 0.4, ease: "power2.out" });
      }

      // Winner card bounce
      if (winnerCardRef.current) {
        tl.from(
          winnerCardRef.current,
          { scale: 0.85, opacity: 0, y: 20, duration: 0.5, ease: "back.out(1.7)" },
          "-=0.1"
        );
      }

      // Rest of songs stagger
      if (restListRef.current && restListRef.current.children.length > 0) {
        tl.from(
          Array.from(restListRef.current.children),
          { opacity: 0, y: 12, stagger: 0.08, duration: 0.35, ease: "power2.out" },
          "-=0.2"
        );
      }

      // Confetti particles — independent of timeline
      if (particlesRef.current) {
        const particles = Array.from(particlesRef.current.children) as HTMLElement[];
        particles.forEach((p) => {
          const startX = parseFloat(p.dataset.startX ?? "0");
          gsap.fromTo(
            p,
            { y: -20, x: startX, opacity: 1, rotate: 0, scale: 1 },
            {
              y: window.innerHeight + 40,
              x: startX + (Math.random() - 0.5) * 200,
              rotate: 360 + Math.random() * 360,
              opacity: 0,
              scale: 0.5,
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 1.5,
              ease: "none",
              repeat: -1,
            }
          );
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleGoHome = () => {
    localStorage.removeItem("nero_participantId");
    localStorage.removeItem("nero_partyCode");
    navigate("/");
  };

  const particleColors = ["#1DB954", "#ffffff", "#FFD700", "#FF6B6B", "#4ECDC4"];
  const winner = songs[0];
  const rest = songs.slice(1);

  return (
    // Overlay is always fully opaque — no GSAP fade on it
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      {/* Confetti — z-0, behind content */}
      <div ref={particlesRef} className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {Array.from({ length: 24 }).map((_, i) => {
          const startX = (i / 24) * (typeof window !== "undefined" ? window.innerWidth : 1200);
          const color = particleColors[i % particleColors.length];
          return (
            <div
              key={i}
              data-start-x={startX}
              className="absolute top-0"
              style={{
                left: startX,
                width: 8,
                height: 8,
                backgroundColor: color,
                borderRadius: i % 2 === 0 ? "50%" : 0,
                opacity: 0,
              }}
            />
          );
        })}
      </div>

      {/* Content — z-10, above confetti */}
      <div ref={contentRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight">
          Party's Over!
        </h1>
        <p className="text-spotify-gray mb-8 text-center">Here are the results...</p>

        {songs.length === 0 && (
          <p className="text-spotify-gray text-center mb-8">No songs were added to this party.</p>
        )}

        <div className="w-full max-w-xl space-y-2">
          {winner && (
            <div
              ref={winnerCardRef}
              className="flex items-center gap-4 rounded-2xl p-5 bg-gradient-to-b from-spotify-green/20 to-transparent border border-spotify-green/30"
            >
              <Trophy size={20} className="text-spotify-green flex-shrink-0" />
              {winner.albumArt && (
                <img src={winner.albumArt} alt={winner.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-spotify-green font-bold truncate text-base">{winner.title}</p>
                <p className="text-spotify-gray text-sm truncate">{winner.artist}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-xl text-spotify-green flex items-center justify-end gap-0.5">
                  {(winner.score ?? 0) >= 0 ? "+" : "-"}
                  <NumberTicker value={Math.abs(winner.score ?? 0)} className="text-spotify-green" />
                </div>
                <div className="text-spotify-gray text-xs mt-0.5">
                  ▲{winner.upvotes ?? 0} ▼{winner.downvotes ?? 0}
                </div>
              </div>
            </div>
          )}

          <div ref={restListRef} className="space-y-2">
            {rest.map((song, idx) => {
              const rank = idx + 1;
              const score = song.score ?? 0;
              return (
                <div
                  key={song.id}
                  className="flex items-center gap-4 rounded-xl p-4 bg-white/5 border border-white/10"
                >
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    {rank === 1 ? (
                      <Medal size={16} className="text-spotify-gray" />
                    ) : rank === 2 ? (
                      <Medal size={16} className="text-spotify-gray/60" />
                    ) : (
                      <Hash size={14} className="text-spotify-gray/40" />
                    )}
                  </div>
                  {song.albumArt && (
                    <img src={song.albumArt} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">{song.title}</p>
                    <p className="text-spotify-gray text-xs truncate">{song.artist}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold ${score >= 0 ? "text-spotify-green" : "text-red-400"}`}>
                      {score >= 0 ? "+" : ""}{score}
                    </div>
                    <div className="text-spotify-gray text-xs">
                      ▲{song.upvotes ?? 0} ▼{song.downvotes ?? 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoHome}
          className="mt-10 border-white/20 text-white hover:bg-white/10 gap-2"
        >
          <LogOut size={16} />
          Go Home
        </Button>
      </div>
    </div>
  );
}
