-- AlterTable
ALTER TABLE "Party" ADD COLUMN "maxParticipants" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isSpectator" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("displayName", "id", "isHost", "joinedAt", "partyId") SELECT "displayName", "id", "isHost", "joinedAt", "partyId" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
