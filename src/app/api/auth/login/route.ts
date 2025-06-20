
import { NextResponse } from 'next/server';
import { createSession, UserSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === 'admin' && password === '123456') {
      const userSession: UserSession = { username: 'admin', isLoggedIn: true };
      await createSession(userSession);
      return NextResponse.json({ ok: true, username: 'admin' });
    } else {
      return NextResponse.json({ ok: false, error: 'Невірний логін або пароль' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ ok: false, error: 'Під час входу сталася неочікувана помилка.' }, { status: 500 });
  }
}
