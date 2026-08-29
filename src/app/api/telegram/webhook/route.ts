import { getBackendUrl } from "@/lib/backend";

export async function POST(request: Request) {
  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (secret) {
    headers.set("X-Telegram-Bot-Api-Secret-Token", secret);
  }

  try {
    const response = await fetch(getBackendUrl("/api/telegram/webhook"), {
      method: "POST",
      body: await request.text(),
      headers,
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return Response.json(
      { message: "Không kết nối được Telegram webhook." },
      { status: 502 },
    );
  }
}
