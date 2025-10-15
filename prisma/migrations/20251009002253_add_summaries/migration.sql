-- CreateEnum
CREATE TYPE "SummaryType" AS ENUM ('KEY_POINTS', 'ACTION_ITEMS', 'DECISIONS', 'HIGHLIGHTS', 'FULL_SUMMARY');

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "type" "SummaryType" NOT NULL,
    "content" TEXT NOT NULL,
    "evidenceSpanIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
