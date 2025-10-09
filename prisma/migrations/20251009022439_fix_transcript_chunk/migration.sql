-- CreateTable
CREATE TABLE "transcript_chunks" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "t0" DOUBLE PRECISION NOT NULL,
    "t1" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "speaker_id" TEXT,
    "confidence" DOUBLE PRECISION,
    "lang" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcript_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transcript_chunks_user_id_createdAt_idx" ON "transcript_chunks"("user_id", "createdAt");

-- AddForeignKey
ALTER TABLE "transcript_chunks" ADD CONSTRAINT "transcript_chunks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
