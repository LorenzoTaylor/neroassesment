import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { env } from "./env.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import partiesRouter from "./routes/parties.js";
import songsRouter from "./routes/songs.js";
import spotifyRouter from "./routes/spotify.js";

const app = express();
const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/parties", partiesRouter);
app.use("/api/songs", songsRouter);
app.use("/api/spotify", spotifyRouter);

// Socket.IO
registerSocketHandlers(io);

// Make io available to routes via req.app.get("io")
app.set("io", io);

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
