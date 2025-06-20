
import { NextResponse } from 'next/server';
import { getSessionData, UserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionData();
    if (session?.isLoggedIn && session.username) {
      return NextResponse.json({ username: session.username, isLoggedIn: true } as UserSession);
    }
    return NextResponse.json({ isLoggedIn: false } as UserSession);
  } catch (error) {
    console.error('Get user session error:', error);
    return NextResponse.json({ isLoggedIn: false, error: 'Не вдалося отримати сесію' } as UserSession, { status: 500 });
  }
}
