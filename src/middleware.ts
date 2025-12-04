import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // 認証不要のパス
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // API認証パスは常に許可
  if (nextUrl.pathname.startsWith("/api/auth")) {
    return;
  }

  // 未認証でプライベートページにアクセス → /login にリダイレクト
  if (!isLoggedIn && !isPublicPath) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // 認証済みでログイン/登録ページにアクセス → /customers にリダイレクト
  if (isLoggedIn && isPublicPath) {
    return Response.redirect(new URL("/customers", nextUrl));
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
