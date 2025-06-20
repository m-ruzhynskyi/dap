
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ ok: false, error: 'Під час виходу сталася неочікувана помилка.' }, { status: 500 });
  }
}
