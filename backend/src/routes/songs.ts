import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// POST /api/songs/:id/vote - Cast vote
router.post("/:id/vote", async (req, res) => {
  try {
    const { id: songId } = req.params;
    const { participantId, value } = req.body;

    if (!participantId || (value !== 1 && value !== -1)) {
      return res.status(400).json({ error: "participantId and value (+1 or -1) required" });
    }

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) return res.status(404).json({ error: "Song not found" });

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.partyId !== song.partyId) {
      return res.status(403).json({ error: "Not in this party" });
    }

    const vote = await prisma.vote.upsert({
      where: { songId_participantId: { songId, participantId } },
      update: { value },
      create: { songId, participantId, value },
    });

    return res.json({ vote });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
