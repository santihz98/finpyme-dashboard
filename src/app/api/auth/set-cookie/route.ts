import { NextRequest, NextResponse } from 'next/server'

interface SetCookieBody {
  token?: string
}

export async function POST(request: NextRequest) {
  const { token } = (await request.json()) as SetCookieBody

  const response = NextResponse.json({ ok: true })

  response.cookies.set('finpyme_token', token ?? '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: token ? 60 * 60 : 0, // 1h — matches backend access_token expiry; 0 clears it
  })

  return response
}
