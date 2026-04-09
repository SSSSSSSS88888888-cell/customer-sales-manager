import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // APIルートは個別のハンドラーで認証管理するため、ミドルウェアではスキップ
  if (nextUrl.pathname.startsWith("/api")) {
    return;
  }

  // 認証不要のパス
  const publicPaths = ["/login", "/register"];
  const isPublicPath =
    nextUrl.pathname === "/" ||
    publicPaths.some((path) => nextUrl.pathname.startsWith(path));

  // 未認証でプライベートページにアクセス → /login にリダイレクト
  if (!isLoggedIn && !isPublicPath) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // 認証済みでログイン/登録ページにアクセス → /dashboard にリダイレクト
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  return;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
