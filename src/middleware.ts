import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Signature verification happens on the FastAPI backend on every request —
// this only gates page/route access on whether a session cookie was set.
export function middleware(request: NextRequest) {
  const token = request.cookies.get('finpyme_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Protect every route under the (dashboard) group, plus internal API
  // routes except the auth bootstrap endpoint, which is what establishes
  // the cookie in the first place.
  matcher: ['/dashboard/:path*', '/empresa/:path*', '/periodos/:path*', '/api/((?!auth/).*)'],
}
