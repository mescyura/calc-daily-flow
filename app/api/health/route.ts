import { mustGetEnv } from "@/app/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Health check timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export async function GET() {
  const supabaseUrl = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const apikey = mustGetEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  // Using GoTrue health endpoint avoids any RLS/DB concerns, but still generates
  // periodic activity against the Supabase project.
  const url = `${supabaseUrl}/auth/v1/health`;

  try {
    const res = await withTimeout(
      fetch(url, {
        method: "GET",
        headers: {
          apikey,
          authorization: `Bearer ${apikey}`,
        },
        // Avoid caching in any intermediary.
        cache: "no-store",
      }),
      8000,
    );

    if (!res.ok) {
      return Response.json(
        { ok: false, status: res.status, statusText: res.statusText },
        { status: 502 },
      );
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}

