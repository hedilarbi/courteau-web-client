import { NextResponse } from "next/server";

export function middleware(request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost || request.headers.get("host") || request.nextUrl.hostname;
  const hostname = hostHeader.split(",")[0].trim().split(":")[0].toLowerCase();

  if (hostname !== "lecourteau.com") {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.hostname = "www.lecourteau.com";
  destination.port = "";
  return NextResponse.redirect(destination, 301);
}

export const config = {
  matcher: "/:path*",
};
