-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "platform" TEXT NOT NULL,
    "attendees" TEXT[],
    "status" TEXT NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidence_span_ids" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whiteboard_snapshots" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "frame_url" TEXT NOT NULL,
    "ocr" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decisions_meeting_id_createdAt_idx" ON "decisions"("meeting_id", "createdAt");

-- CreateIndex
CREATE INDEX "whiteboard_snapshots_meeting_id_createdAt_idx" ON "whiteboard_snapshots"("meeting_id", "createdAt");

-- CreateIndex
CREATE INDEX "whiteboard_snapshots_meeting_id_version_idx" ON "whiteboard_snapshots"("meeting_id", "version");

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_snapshots" ADD CONSTRAINT "whiteboard_snapshots_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
