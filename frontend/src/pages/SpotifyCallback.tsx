import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCode } from "../lib/spotify";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError("Spotify authorization denied");
      return;
    }

    if (!code) {
      setError("No authorization code received");
      return;
    }

    const verifier = localStorage.getItem("nero_pkce_verifier");
    if (!verifier) {
      setError("Missing code verifier");
      return;
    }

    exchangeCode(code, verifier)
      .then(() => {
        localStorage.removeItem("nero_pkce_verifier");
        const partyCode = localStorage.getItem("nero_partyCode");
        if (partyCode) {
          navigate(`/party/${partyCode}`);
        } else {
          navigate("/");
        }
      })
      .catch((err) => {
        setError(err.message || "Authentication failed");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="text-spotify-green hover:underline">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center">
      <p className="text-spotify-gray">Connecting to Spotify...</p>
    </div>
  );
}
