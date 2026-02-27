import { env } from "../env.js";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getClientToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify client token");
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

export async function searchTracks(query: string) {
  const token = await getClientToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Spotify search failed");
  }

  const data = await response.json() as any;
  return data.tracks.items.map((track: any) => ({
    spotifyId: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    albumArt: track.album.images[0]?.url ?? "",
    previewUrl: track.preview_url,
    durationMs: track.duration_ms,
  }));
}
