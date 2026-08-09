// // middleware.ts
// import { NextRequest, NextResponse } from "next/server";

// //  Gardez le nom du fichier mais utilisez la nouvelle signature
// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const token = request.cookies.get("access_token")?.value;

//   const protectedRoutes = ["/admin", "/writer"];
//   const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

//   if (isProtected && !token) {
//     const url = new URL("/login", request.url);
//     url.searchParams.set("next", pathname);
//     return NextResponse.redirect(url);
//   }

//   if (pathname === "/login" && token) {
//     return NextResponse.next();
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/admin/:path*", "/writer/:path*", "/login"],
// };

// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Laisser passer toutes les requêtes
  // L'auth est gérée côté client par AuthGuard
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/writer/:path*", "/login"],
};