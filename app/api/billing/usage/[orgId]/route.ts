import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { orgId: string } }) {
  const { orgId } = params;

  const usage = await prisma.billingUsage.findMany({
    where: { orgId },
    orderBy: { month: "desc" },
  });

  return NextResponse.json({
    orgId,
    usage,
  });
}
