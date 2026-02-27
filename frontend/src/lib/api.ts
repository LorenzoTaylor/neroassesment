const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export interface SongData {
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
  durationMs: number;
}

export const api = {
  createParty: (name: string, displayName: string, maxSongs?: number, songsPerPerson?: number, maxParticipants?: number) =>
    apiFetch("/api/parties", {
      method: "POST",
      body: JSON.stringify({ name, displayName, maxSongs, songsPerPerson, maxParticipants }),
    }),

  getParty: (code: string) => apiFetch(`/api/parties/${code}`),

  joinParty: (code: string, displayName?: string) =>
    apiFetch(`/api/parties/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ displayName }),
    }),

  nextSong: (code: string, participantId: string) =>
    apiFetch(`/api/parties/${code}/next`, {
      method: "POST",
      body: JSON.stringify({ participantId }),
    }),

  endParty: (code: string, participantId: string) =>
    apiFetch(`/api/parties/${code}/end`, {
      method: "POST",
      body: JSON.stringify({ participantId }),
    }),

  searchSpotify: (q: string) => apiFetch(`/api/spotify/search?q=${encodeURIComponent(q)}`),

  addSong: (code: string, participantId: string, song: SongData) =>
    apiFetch(`/api/parties/${code}/songs`, {
      method: "POST",
      body: JSON.stringify({ participantId, ...song }),
    }),

  castVote: (songId: string, participantId: string, value: 1 | -1) =>
    apiFetch(`/api/songs/${songId}/vote`, {
      method: "POST",
      body: JSON.stringify({ participantId, value }),
    }),
};
