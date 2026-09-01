import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_TOKEN_COOKIE_NAME);
  response.cookies.delete("shop_admin_access");
  response.cookies.delete("shop_admin_otp_challenge");
  response.cookies.delete("shop_game_auth");
  return response;
}
