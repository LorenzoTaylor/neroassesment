import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function generateCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8).padEnd(6, "0");
}

// POST /api/parties - Create party
router.post("/", async (req, res) => {
  try {
    const { name, displayName, maxSongs, songsPerPerson } = req.body;
    if (!name || !displayName) {
      return res.status(400).json({ error: "name and displayName required" });
    }

    let code = generateCode();
    // ensure unique
    while (await prisma.party.findUnique({ where: { code } })) {
      code = generateCode();
    }

    const party = await prisma.party.create({
      data: {
        code,
        name,
        maxSongs: maxSongs ? parseInt(maxSongs) : null,
        songsPerPerson: songsPerPerson ? parseInt(songsPerPerson) : null,
        participants: {
          create: {
            displayName,
            isHost: true,
          },
        },
      },
      include: {
        participants: true,
        songs: true,
      },
    });

    const host = party.participants[0];
    return res.json({ party, participantId: host.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/parties/:code - Get party state (no vote counts)
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const party = await prisma.party.findUnique({
      where: { code },
      include: {
        participants: true,
        songs: {
          orderBy: { queuePosition: "asc" },
        },
      },
    });

    if (!party) {
      return res.status(404).json({ error: "Party not found" });
    }

    return res.json({ party });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/parties/:code/join
router.post("/:code/join", async (req, res) => {
  try {
    const { code } = req.params;
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: "displayName required" });
    }

    const party = await prisma.party.findUnique({ where: { code } });
    if (!party) {
      return res.status(404).json({ error: "Party not found" });
    }

    if (party.status === "ended") {
      return res.status(400).json({ error: "Party has ended" });
    }

    const participant = await prisma.participant.create({
      data: {
        partyId: party.id,
        displayName,
        isHost: false,
      },
    });

    // Emit participant:joined via socket
    const io = req.app.get("io");
    io.to(`party:${code}`).emit("participant:joined", { participant });

    return res.json({ participantId: participant.id, participant });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/parties/:code/next - Host advances to next song
router.post("/:code/next", async (req, res) => {
  try {
    const { code } = req.params;
    const { participantId } = req.body;

    const party = await prisma.party.findUnique({
      where: { code },
      include: { songs: { orderBy: { queuePosition: "asc" } } },
    });
    if (!party) return res.status(404).json({ error: "Party not found" });

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || !participant.isHost) {
      return res.status(403).json({ error: "Only host can advance song" });
    }

    // Find next unplayed song
    const nextSong = party.songs.find((s) => !s.playedAt);
    if (!nextSong) {
      // No more songs — compute scores, emit party:ended, end party
      await prisma.party.update({ where: { code }, data: { status: "ended" } });

      const allSongs = await prisma.song.findMany({
        where: { partyId: party.id },
        include: { votes: true },
        orderBy: { queuePosition: "asc" },
      });
      const scoredSongs = allSongs
        .map((song) => {
          const upvotes = song.votes.filter((v) => v.value === 1).length;
          const downvotes = song.votes.filter((v) => v.value === -1).length;
          return { ...song, votes: undefined, upvotes, downvotes, score: upvotes - downvotes };
        })
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.queuePosition - b.queuePosition));

      const io = req.app.get("io");
      io.to(`party:${code}`).emit("party:ended", { songs: scoredSongs });

      return res.json({ ended: true, songs: scoredSongs });
    }

    const now = new Date();
    const updatedSong = await prisma.song.update({
      where: { id: nextSong.id },
      data: { playedAt: now },
    });

    await prisma.party.update({ where: { code }, data: { status: "active" } });

    // Emit song:playing via socket
    const io = req.app.get("io");
    io.to(`party:${code}`).emit("song:playing", { song: updatedSong, startedAt: now.getTime() });

    return res.json({ song: updatedSong, startedAt: now.getTime() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/parties/:code/end - Host ends party
router.post("/:code/end", async (req, res) => {
  try {
    const { code } = req.params;
    const { participantId } = req.body;

    const party = await prisma.party.findUnique({ where: { code } });
    if (!party) return res.status(404).json({ error: "Party not found" });

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || !participant.isHost) {
      return res.status(403).json({ error: "Only host can end party" });
    }

    await prisma.party.update({ where: { code }, data: { status: "ended" } });

    // Get songs with vote tallies
    const songs = await prisma.song.findMany({
      where: { partyId: party.id },
      include: { votes: true },
      orderBy: { queuePosition: "asc" },
    });

    const scoredSongs = songs
      .map((song) => {
        const upvotes = song.votes.filter((v) => v.value === 1).length;
        const downvotes = song.votes.filter((v) => v.value === -1).length;
        return {
          ...song,
          votes: undefined,
          upvotes,
          downvotes,
          score: upvotes - downvotes,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.queuePosition - b.queuePosition;
      });

    // Emit party:ended via socket
    const io = req.app.get("io");
    io.to(`party:${code}`).emit("party:ended", { songs: scoredSongs });

    return res.json({ songs: scoredSongs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/parties/:code/songs - Add song to queue
router.post("/:code/songs", async (req, res) => {
  try {
    const { code } = req.params;
    const { participantId, spotifyId, title, artist, albumArt, previewUrl, durationMs } = req.body;

    if (!participantId || !spotifyId || !title || !artist) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const party = await prisma.party.findUnique({
      where: { code },
      include: { songs: true },
    });
    if (!party) return res.status(404).json({ error: "Party not found" });

    if (party.status === "ended") {
      return res.status(400).json({ error: "Party has ended" });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.partyId !== party.id) {
      return res.status(403).json({ error: "Not in this party" });
    }

    if (party.maxSongs && party.songs.length >= party.maxSongs) {
      return res.status(400).json({ error: "Queue is full" });
    }

    if (party.songsPerPerson) {
      const userSongCount = party.songs.filter(
        (s) => s.addedById === participantId
      ).length;
      if (userSongCount >= party.songsPerPerson) {
        return res.status(400).json({ error: "Song limit reached" });
      }
    }

    const queuePosition = party.songs.length;
    const song = await prisma.song.create({
      data: {
        partyId: party.id,
        spotifyId,
        title,
        artist,
        albumArt,
        previewUrl: previewUrl || null,
        durationMs: parseInt(durationMs),
        addedById: participantId,
        queuePosition,
      },
    });

    const songs = await prisma.song.findMany({
      where: { partyId: party.id },
      orderBy: { queuePosition: "asc" },
    });

    const io = req.app.get("io");
    io.to(`party:${code}`).emit("queue:updated", { songs });

    return res.json({ song, songs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
