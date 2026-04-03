import { NextRequest, NextResponse } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({})) as { password?: string };

  const sitePassword = process.env.SITE_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!sitePassword || !authSecret) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  if (!password || password !== sitePassword) {
    return NextResponse.json({ error: "Fel lösenord." }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from") ?? "/";
  const res = NextResponse.redirect(new URL(from, req.url));

  res.cookies.set("auth", authSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
