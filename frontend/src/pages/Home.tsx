import { useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, User, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gsap } from "gsap";
import { api } from "../lib/api";

// Pre-computed at module level — never recalculated on re-render
function wavePath(W: number, H: number, amp: number, cycles: number, phase = 0) {
  const mid = H / 2;
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x},${(mid + amp * Math.sin((x / W) * cycles * 2 * Math.PI + phase)).toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}
const VBW = 2880, VBH = 90;
const WAVE1 = wavePath(VBW, VBH, 18, 6);
const WAVE2 = wavePath(VBW, VBH, 10, 8, Math.PI / 3);
const WAVE3 = wavePath(VBW, VBH, 22, 4, Math.PI / 2);

export default function Home() {
  const navigate = useNavigate();
  const [createForm, setCreateForm] = useState({
    name: "",
    displayName: "",
    maxSongs: "",
    songsPerPerson: "",
  });
  const [joinForm, setJoinForm] = useState({ code: "", displayName: "" });
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (titleRef.current) {
        tl.from(titleRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        });
      }
      if (card1Ref.current && card2Ref.current) {
        tl.from([card1Ref.current, card2Ref.current], {
          y: 30,
          opacity: 0,
          stagger: 0.12,
          duration: 0.5,
          ease: "power3.out",
        }, "-=0.3");
      }
      // Infinite scrolling wave
      if (waveRef.current) {
        gsap.to(waveRef.current, {
          x: "-50%",
          duration: 8,
          repeat: -1,
          ease: "none",
          force3D: true,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name.trim() || !createForm.displayName.trim()) {
      setCreateError("Party name and display name are required");
      return;
    }
    setCreating(true);
    try {
      const data = await api.createParty(
        createForm.name.trim(),
        createForm.displayName.trim(),
        createForm.maxSongs ? parseInt(createForm.maxSongs) : undefined,
        createForm.songsPerPerson ? parseInt(createForm.songsPerPerson) : undefined
      );
      localStorage.setItem("nero_participantId", data.participantId);
      localStorage.setItem("nero_partyCode", data.party.code);
      navigate(`/party/${data.party.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create party");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    if (!joinForm.code.trim() || !joinForm.displayName.trim()) {
      setJoinError("Code and display name are required");
      return;
    }
    setJoining(true);
    try {
      const data = await api.joinParty(joinForm.code.trim().toUpperCase(), joinForm.displayName.trim());
      localStorage.setItem("nero_participantId", data.participantId);
      localStorage.setItem("nero_partyCode", joinForm.code.trim().toUpperCase());
      navigate(`/party/${joinForm.code.trim().toUpperCase()}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join party");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-spotify-black flex items-center justify-center p-4 overflow-hidden">

      {/* Subtle green glow — no white haze */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[700px] h-[700px] rounded-full bg-spotify-green/[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl pt-36">
        {/* Floating navbar */}
        <nav className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,1080px)] h-16 bg-[#2e2e2e]/95 backdrop-blur-md rounded-full flex items-center px-8">
          {/* Left */}
          <div className="flex items-center gap-6 flex-1">
            <button className="text-white hover:scale-110 transition-transform duration-150">
              <Search size={22} strokeWidth={1.75} />
            </button>
            <span className="text-[13px] font-bold tracking-widest text-spotify-green select-none">LIVE</span>
            <span className="w-px h-5 bg-white/20" />
            <a
              href="https://www.nero.fan/discover"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[15px] text-white/60 hover:text-white hover:scale-105 transition-all duration-150 whitespace-nowrap"
            >
              View streams <ArrowRight size={15} strokeWidth={1.75} />
            </a>
          </div>

          {/* Center */}
          <div className="flex items-center gap-3 text-white font-semibold text-[34px] tracking-wide select-none">
            <Flame size={38} strokeWidth={1.5} />
            <span>nero</span>
          </div>

          {/* Right */}
          <div className="flex items-center justify-end flex-1">
            <button className="text-white hover:scale-110 transition-transform duration-150">
              <User size={22} strokeWidth={1.75} />
            </button>
          </div>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Party */}
          <div
            ref={card1Ref}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-white font-semibold text-base mb-5">Create a Party</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                  Party Name
                </label>
                <Input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Friday Night Vibes"
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                  Your Name
                </label>
                <Input
                  type="text"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="DJ Lorenzo"
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green"
                />
              </div>

              <div className="pt-1 pb-1">
                <p className="text-xs text-spotify-gray/70 uppercase tracking-widest font-semibold">
                  — optional —
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                    Max Songs
                  </label>
                  <Input
                    type="number"
                    value={createForm.maxSongs}
                    onChange={(e) => setCreateForm((f) => ({ ...f, maxSongs: e.target.value }))}
                    placeholder="∞"
                    min="1"
                    className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                    Per Person
                  </label>
                  <Input
                    type="number"
                    value={createForm.songsPerPerson}
                    onChange={(e) => setCreateForm((f) => ({ ...f, songsPerPerson: e.target.value }))}
                    placeholder="∞"
                    min="1"
                    className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green"
                  />
                </div>
              </div>

              {createError && <p className="text-red-400 text-sm">{createError}</p>}

              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-spotify-green text-black hover:bg-spotify-green/90 font-semibold rounded-full"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                {creating ? "Creating..." : "Create Party"}
              </Button>
            </form>
          </div>

          {/* Join Party */}
          <div
            ref={card2Ref}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-white font-semibold text-base mb-5">Join a Party</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                  Party Code
                </label>
                <Input
                  type="text"
                  value={joinForm.code}
                  onChange={(e) => setJoinForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="ABC123"
                  maxLength={6}
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green font-mono text-lg tracking-widest"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-spotify-gray">
                  Your Name
                </label>
                <Input
                  type="text"
                  value={joinForm.displayName}
                  onChange={(e) => setJoinForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Alice"
                  className="bg-black/40 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-spotify-green focus-visible:border-spotify-green"
                />
              </div>

              {joinError && <p className="text-red-400 text-sm">{joinError}</p>}

              <Button
                type="submit"
                disabled={joining}
                variant="outline"
                className="w-full border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-black font-semibold rounded-full transition-colors mt-10"
              >
                {joining && <Loader2 size={16} className="animate-spin" />}
                {joining ? "Joining..." : "Join Party"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Waveform background */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden"
        style={{
          height: "55vh",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
        }}
      >
        <div ref={waveRef} style={{ width: "200%", height: "100%" }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none">
            <path d={WAVE1} stroke="#1DB954" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d={WAVE2} stroke="#1DB954" strokeWidth="1" fill="none" opacity="0.25" />
            <path d={WAVE3} stroke="white" strokeWidth="1" fill="none" opacity="0.08" />
          </svg>
        </div>
      </div>
    </div>
  );
}
