import { describe, it } from "node:test";
import { expect } from "./_expect";
import { apiHandler, safeJson } from "@/lib/api";
import { AuthError } from "@/lib/rbac";
import { z } from "zod";

describe("apiHandler", () => {
  it("returns {ok:true,data} with status 200 on success", async () => {
    const res = await apiHandler(async () => ({ hello: "world" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ hello: "world" });
  });

  it("returns null data on success when fn returns null", async () => {
    const res = await apiHandler(async () => null);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toBeNull();
  });

  it("maps AuthError 401 to status 401 with {ok:false,error}", async () => {
    const res = await apiHandler(async () => {
      throw new AuthError(401, "Tidak terautentikasi");
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Tidak terautentikasi");
  });

  it("maps AuthError 403 to status 403", async () => {
    const res = await apiHandler(async () => {
      throw new AuthError(403, "Akses ditolak");
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Akses ditolak");
  });

  it("maps AuthError 409 to status 409", async () => {
    const res = await apiHandler(async () => {
      throw new AuthError(409, "Konflik data");
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("maps AuthError 429 to status 429", async () => {
    const res = await apiHandler(async () => {
      throw new AuthError(429, "Rate limited");
    });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Rate limited");
  });

  it("maps ZodError to status 400 with issues", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const res = await apiHandler(async () => {
      schema.parse({ name: 123, age: "bad" });
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Input tidak valid.");
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("maps SyntaxError to status 400", async () => {
    const res = await apiHandler(async () => {
      throw new SyntaxError("Unexpected token");
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("JSON tidak valid.");
  });

  it("maps generic Error to status 500", async () => {
    const res = await apiHandler(async () => {
      throw new Error("something broke");
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Kesalahan server.");
  });

  it("maps non-Error throw to status 500", async () => {
    const res = await apiHandler(async () => {
      throw "raw string";
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("includes x-request-id header when req is provided", async () => {
    const req = new Request("http://x", {
      headers: { "x-request-id": "test-rid-123" },
    });
    const res = await apiHandler(async () => "ok", { req });
    expect(res.headers.get("x-request-id")).toBe("test-rid-123");
  });
});

describe("safeJson", () => {
  it("parses valid JSON body", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    const result = await safeJson(req);
    expect(result).toEqual({ a: 1 });
  });

  it("throws SyntaxError on empty body", async () => {
    const req = new Request("http://x", { method: "POST", body: "" });
    let threw = false;
    let err: unknown;
    try {
      await safeJson(req);
    } catch (e) {
      threw = true;
      err = e;
    }
    expect(threw).toBe(true);
    expect(err instanceof SyntaxError).toBe(true);
  });

  it("throws SyntaxError on invalid JSON", async () => {
    const req = new Request("http://x", { method: "POST", body: "{not json" });
    let threw = false;
    let err: unknown;
    try {
      await safeJson(req);
    } catch (e) {
      threw = true;
      err = e;
    }
    expect(threw).toBe(true);
    expect(err instanceof SyntaxError).toBe(true);
  });

  it("parses arrays", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify([1, 2, 3]),
    });
    const result = await safeJson(req);
    expect(result).toEqual([1, 2, 3]);
  });

  it("parses string primitives", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify("hello"),
    });
    const result = await safeJson(req);
    expect(result).toBe("hello");
  });
});
