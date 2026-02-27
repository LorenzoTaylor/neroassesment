import { useState, useEffect } from "react";
import { getStoredToken, getAuthUrl } from "../lib/spotify";

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (state: any) => void) => void;
  removeListener: (event: string) => void;
}

export function useSpotify() {
  const [token, setToken] = useState<string | null>(null);
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredToken().then((t) => setToken(t));
  }, []);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const p = new window.Spotify.Player({
        name: "Nero Party",
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      });

      p.addListener("ready", ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
        setIsReady(true);
      });

      p.addListener("not_ready", () => setIsReady(false));

      p.connect();
      setPlayer(p);
    };

    return () => {
      document.body.removeChild(script);
      player?.disconnect();
    };
  }, [token]);

  const connectSpotify = async () => {
    const url = await getAuthUrl();
    window.location.href = url;
  };

  const playTrack = async (spotifyId: string, offsetMs: number = 0) => {
    if (!token || !deviceId) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [`spotify:track:${spotifyId}`],
        position_ms: offsetMs,
      }),
    });
  };

  return {
    token,
    player,
    deviceId,
    isReady,
    isSpotifyConnected: !!token,
    connectSpotify,
    playTrack,
  };
}
