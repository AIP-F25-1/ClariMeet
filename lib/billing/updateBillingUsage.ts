import { prisma } from "@/lib/prisma";

export async function updateBillingUsage(orgId: string, transcriptionMinutes: number) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await prisma.billingUsage.upsert({
    where: {
      orgId_month: {
        orgId,
        month: monthStart,
      },
    },
    create: {
      orgId,
      month: monthStart,
      transcriptionMinutes: transcriptionMinutes,  // no Decimal
      meetingCount: 1,
    },
    update: {
      transcriptionMinutes: {
        increment: transcriptionMinutes,           // no Decimal
      },
      meetingCount: { increment: 1 },
    },
  });
}
