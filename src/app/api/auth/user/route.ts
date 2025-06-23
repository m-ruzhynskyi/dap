
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth';
import type { UserSession } from '@/types';

export async function GET() {
  try {
    const session = await getSessionData();
    if (session?.isLoggedIn && session.username) {
      return NextResponse.json({ 
        id: session.id,
        username: session.username, 
        isLoggedIn: true,
        role: session.role,
        department: session.department
      } as UserSession);
    }
    return NextResponse.json({ isLoggedIn: false } as UserSession);
  } catch (error) {
    console.error('Get user session error:', error);
    return NextResponse.json({ isLoggedIn: false, error: 'Не вдалося отримати сесію' } as UserSession, { status: 500 });
  }
}
