import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";

const socketPartyMap = new Map<string, { partyCode: string; participantId: string }>();

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", async ({ partyCode, participantId }: { partyCode: string; participantId: string }) => {
      try {
        const party = await prisma.party.findUnique({
          where: { code: partyCode },
          include: {
            participants: true,
            songs: { orderBy: { queuePosition: "asc" } },
          },
        });

        if (!party) {
          socket.emit("error", { message: "Party not found" });
          return;
        }

        socket.join(`party:${partyCode}`);
        socketPartyMap.set(socket.id, { partyCode, participantId });

        // Send full state to the joining client
        socket.emit("party:state", { party });
      } catch (err) {
        console.error("join_room error:", err);
      }
    });

    socket.on("disconnect", async () => {
      const info = socketPartyMap.get(socket.id);
      if (info) {
        const { partyCode, participantId } = info;
        socketPartyMap.delete(socket.id);
        io.to(`party:${partyCode}`).emit("participant:left", { participantId });
      }
      console.log("Client disconnected:", socket.id);
    });
  });
}
