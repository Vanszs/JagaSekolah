import { randomUUID } from "node:crypto";

type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  [k: string]: unknown;
}

function emit(level: Level, msg: string, fields?: LogFields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, f?: LogFields) => emit("debug", msg, f),
  info: (msg: string, f?: LogFields) => emit("info", msg, f),
  warn: (msg: string, f?: LogFields) => emit("warn", msg, f),
  error: (msg: string, f?: LogFields) => emit("error", msg, f),
};

/** Ambil/bangkitkan request id dari header (untuk tracing). */
export function requestId(req: Request): string {
  return req.headers.get("x-request-id") ?? randomUUID();
}
