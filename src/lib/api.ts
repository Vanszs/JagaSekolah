import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { log, requestId } from "@/lib/log";

/** Bungkus handler API: map error ke status + structured logging + request id. */
export async function apiHandler<T>(
  fn: () => Promise<T>,
  ctx?: { req?: Request; route?: string }
): Promise<NextResponse> {
  const rid = ctx?.req ? requestId(ctx.req) : undefined;
  const started = Date.now();
  try {
    const data = await fn();
    log.info("api_ok", { rid, route: ctx?.route, ms: Date.now() - started });
    return NextResponse.json({ ok: true, data }, { headers: rid ? { "x-request-id": rid } : {} });
  } catch (e) {
    if (e instanceof AuthError) {
      log.warn("api_auth_error", { rid, route: ctx?.route, code: e.code });
      return NextResponse.json({ ok: false, error: e.message }, { status: e.code });
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Input tidak valid.", issues: e.issues },
        { status: 400 }
      );
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ ok: false, error: "JSON tidak valid." }, { status: 400 });
    }
    log.error("api_unhandled", { rid, route: ctx?.route, err: String(e) });
    return NextResponse.json({ ok: false, error: "Kesalahan server." }, { status: 500 });
  }
}

/** Parse JSON body dengan aman (SyntaxError -> 400). */
export async function safeJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) throw new SyntaxError("Body kosong.");
  return JSON.parse(text);
}

/** Terapkan rate limit; lempar AuthError 429 bila terlampaui. */
export async function rateLimit(key: string): Promise<void> {
  if (await checkRateLimit(key)) {
    throw new AuthError(429, "Terlalu banyak permintaan. Coba lagi nanti.");
  }
}
