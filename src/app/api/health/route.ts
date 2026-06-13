import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET /api/health - liveness + readiness (DB). */
export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = `ok (${Date.now() - t0}ms)`;
  } catch {
    checks.db = "error";
    healthy = false;
  }

  return NextResponse.json(
    {
      ok: healthy,
      status: healthy ? "healthy" : "degraded",
      checks,
      provider: process.env.DATABASE_PROVIDER ?? "sqlite",
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
