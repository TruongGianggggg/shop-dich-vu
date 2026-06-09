import { getBackendUrl } from "@/lib/backend";
import {
  createSampleAuthResponse,
  findSampleAccount,
} from "@/lib/sample-accounts";

export async function POST(request: Request) {
  const body = await request.text();
  const payload = safeParseLogin(body);

  try {
    const response = await fetch(getBackendUrl("/api/auth/login"), {
      method: "POST",
      body,
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return Response.json(await response.json());
    }
  } catch {}

  const sampleAccount = findSampleAccount(payload.login, payload.password);

  if (sampleAccount) {
    return Response.json(createSampleAuthResponse(sampleAccount));
  }

  return Response.json(
    { message: "Dang nhap that bai. Hay kiem tra tai khoan va mat khau." },
    { status: 401 },
  );
}

function safeParseLogin(body: string) {
  try {
    const data = JSON.parse(body) as { login?: unknown; password?: unknown };

    return {
      login: typeof data.login === "string" ? data.login : "",
      password: typeof data.password === "string" ? data.password : "",
    };
  } catch {
    return { login: "", password: "" };
  }
}
