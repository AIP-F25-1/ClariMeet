import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { verifyAuditChain } from "@/lib/audit"

export async function GET(request: Request) {
	try {
		const me = auth(request)
		if (!me?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const page = Math.max(1, Number(searchParams.get("page") || 1))
		const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("page_size") || 20)))
		const userId = searchParams.get("user_id") || undefined
		const action = searchParams.get("action") || undefined
		const entityType = searchParams.get("entity_type") || undefined
		const entityId = searchParams.get("entity_id") || undefined
		const from = searchParams.get("from")
		const to = searchParams.get("to")
		const verify = (searchParams.get("verify") || "false").toLowerCase() === "true"

		// Authorization: non-admins can only view their own logs
		const isAdmin = me.role === "ADMIN"
		if (!isAdmin && userId && userId !== me.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 })
		}

		const where: any = {}
		if (userId || (!isAdmin && !userId)) {
			where.userId = userId || me.id
		}
		if (action) where.action = action
		if (entityType) where.entityType = entityType
		if (entityId) where.entityId = entityId
		if (from || to) {
			where.createdAt = {}
			if (from) where.createdAt.gte = new Date(from)
			if (to) where.createdAt.lte = new Date(to)
		}

		const [total, logs] = await Promise.all([
			prisma.auditLog.count({ where }),
			prisma.auditLog.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * pageSize,
				take: pageSize,
			})
		])

		let verified: boolean | undefined
		if (verify) {
			// Verify chain integrity within the current page, using ascending order
			const asc = [...logs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
			verified = verifyAuditChain(asc as any)
		}

		return NextResponse.json({
			logs,
			page,
			page_size: pageSize,
			total,
			has_next: page * pageSize < total,
			verified,
		})
	} catch (error) {
		console.error("Fetch audit logs error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}


