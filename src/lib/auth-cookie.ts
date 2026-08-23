import "server-only";

export const AUTH_TOKEN_COOKIE_NAME = "shop_game_token";

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
