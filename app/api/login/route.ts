import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = process.env.APP_PASSWORD || 'academy2024'
const COOKIE_NAME = 'academy_auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password === PASSWORD) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
