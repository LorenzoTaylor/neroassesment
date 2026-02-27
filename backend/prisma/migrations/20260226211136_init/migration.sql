-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "maxSongs" INTEGER,
    "songsPerPerson" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumArt" TEXT NOT NULL,
    "previewUrl" TEXT,
    "durationMs" INTEGER NOT NULL,
    "addedById" TEXT NOT NULL,
    "playedAt" DATETIME,
    "queuePosition" INTEGER NOT NULL,
    CONSTRAINT "Song_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Song_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_code_key" ON "Party"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_songId_participantId_key" ON "Vote"("songId", "participantId");
