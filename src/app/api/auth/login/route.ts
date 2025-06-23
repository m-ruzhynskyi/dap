
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { User, UserSession } from '@/types';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'Логін та пароль є обов\'язковими' }, { status: 400 });
    }

    const result = await query('SELECT id, username, password, role, department FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Невірний логін або пароль' }, { status: 401 });
    }

    const user: User = result.rows[0];

    if (user.password !== password) {
      return NextResponse.json({ ok: false, error: 'Невірний логін або пароль' }, { status: 401 });
    }

    const userSession: UserSession = { 
      id: user.id,
      username: user.username, 
      isLoggedIn: true,
      role: user.role,
      department: user.department,
    };
    await createSession(userSession);
    
    return NextResponse.json({ ok: true, username: user.username, role: user.role });

  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Під час входу сталася неочікувана помилка.';
    if (error.message && error.message.includes('relation "users" does not exist')) {
        errorMessage = 'Таблицю користувачів не знайдено в базі даних. Будь ласка, запустіть скрипт міграції.';
    }
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
