import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Middleware用の軽量設定（Prismaなし）
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      // 実際の認証はauth.tsで行う
      authorize: () => null,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // APIルートは個別のハンドラーで認証管理
      if (nextUrl.pathname.startsWith("/api")) {
        return true;
      }

      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/login", "/register"];
      const isPublicPath =
        nextUrl.pathname === "/" ||
        publicPaths.some((path) => nextUrl.pathname.startsWith(path));

      if (!isLoggedIn && !isPublicPath) {
        return false;
      }

      return true;
    },
  },
};
