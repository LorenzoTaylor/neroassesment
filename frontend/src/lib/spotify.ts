const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";

function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .slice(0, 128);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function getAuthUrl(): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("nero_pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string, verifier: string): Promise<void> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) throw new Error("Token exchange failed");

  const data = await res.json();
  localStorage.setItem("nero_spotify_token", data.access_token);
  localStorage.setItem("nero_spotify_refresh", data.refresh_token);
  localStorage.setItem("nero_spotify_expires", String(Date.now() + data.expires_in * 1000));
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("nero_spotify_refresh");
  if (!refreshToken) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  localStorage.setItem("nero_spotify_token", data.access_token);
  localStorage.setItem("nero_spotify_expires", String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) {
    localStorage.setItem("nero_spotify_refresh", data.refresh_token);
  }
  return data.access_token;
}

export async function getStoredToken(): Promise<string | null> {
  const token = localStorage.getItem("nero_spotify_token");
  const expires = parseInt(localStorage.getItem("nero_spotify_expires") || "0");

  if (!token) return null;
  if (Date.now() < expires - 60000) return token;

  return refreshAccessToken();
}
