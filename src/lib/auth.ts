
import { sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import type { IronSessionOptions } from 'iron-session';

export interface UserSession {
  username?: string;
  isLoggedIn?: boolean;
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET as string, 
  cookieName: 'techtracker-auth-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, 
  },
};

export async function createSession(data: UserSession) {
  const sealedData = await sealData(data, { password: sessionOptions.password });
  cookies().set(sessionOptions.cookieName, sealedData, sessionOptions.cookieOptions);
}

export async function getSessionData(): Promise<UserSession | null> {
  const cookie = cookies().get(sessionOptions.cookieName);
  if (!cookie?.value) return null;

  try {
    const data = await unsealData<UserSession>(cookie.value, { password: sessionOptions.password });
    return data;
  } catch (error) {
    console.error('Failed to unseal session data:', error);
    return null;
  }
}

export async function destroySession() {
  cookies().delete(sessionOptions.cookieName);
}
