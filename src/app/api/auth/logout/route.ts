import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  ADMIN_OTP_CHALLENGE_COOKIE_NAME,
} from "@/lib/admin-otp";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_TOKEN_COOKIE_NAME);
  response.cookies.delete(ADMIN_ACCESS_COOKIE_NAME);
  response.cookies.delete(ADMIN_OTP_CHALLENGE_COOKIE_NAME);
  response.cookies.delete("shop_game_auth");
  return response;
}
