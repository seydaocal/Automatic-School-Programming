import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "admin" | "ogretmen";

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/giris", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/register" ||
    pathname.startsWith("/api/ogretmen-panel") ||
    pathname.startsWith("/api/swagger")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    );
  }

  if (!token) {
    return loginRedirect(request);
  }

  const role = token.rol as UserRole | undefined;

  if (pathname.startsWith("/api/") && role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Bu işlem için yönetici yetkisi gerekiyor." },
      { status: 403 }
    );
  }

  if (pathname.startsWith("/yonetim") && role !== "admin") {
    return NextResponse.redirect(new URL("/ogretmen", request.url));
  }

  if (pathname.startsWith("/ogretmen") && role !== "ogretmen") {
    return NextResponse.redirect(new URL("/yonetim/okul", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/yonetim/:path*", "/ogretmen/:path*", "/api/:path*"],
};