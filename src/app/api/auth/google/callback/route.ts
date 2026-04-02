import { NextRequest, NextResponse } from 'next/server';
import { createSession, setSessionCookie, upsertUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=google_denied', request.url));
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url));
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url));
    }

    const googleUser = await userInfoRes.json();
    // googleUser has: id, email, name, picture, etc.

    // Upsert user in our database
    const user = await upsertUser(googleUser.email, googleUser.name, googleUser.picture, 'google');

    // Create session
    const sessionId = await createSession(user.id);
    setSessionCookie(sessionId);

    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
