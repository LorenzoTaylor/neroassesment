import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Party from "./pages/Party";
import SpotifyCallback from "./pages/SpotifyCallback";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/party/:code" element={<Party />} />
        <Route path="/callback" element={<SpotifyCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
