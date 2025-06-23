
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionData } from '@/lib/auth';
import type { UserFormData } from '@/types';
import { randomUUID } from 'crypto';

async function checkAdmin(request: Request) {
    const session = await getSessionData();
    if (!session?.isLoggedIn || session.role !== 'admin') {
        return new NextResponse(JSON.stringify({ error: 'Не авторизовано або недостатньо прав.' }), { status: 403 });
    }
    return null;
}

export async function GET(request: Request) {
    const adminError = await checkAdmin(request);
    if (adminError) return adminError;
    
    try {
        const result = await query('SELECT id, username, role, department FROM users ORDER BY username ASC');
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Error fetching users. Raw error:", error);
        return NextResponse.json({ error: 'Не вдалося завантажити користувачів.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const adminError = await checkAdmin(request);
    if (adminError) return adminError;

    try {
        const body: UserFormData = await request.json();

        if (!body.username || !body.password || !body.role || !body.department) {
            return NextResponse.json({ error: 'Відсутні обов\'язкові поля' }, { status: 400 });
        }

        const id = randomUUID();
        
        const insertQuery = `
            INSERT INTO users (id, username, password, role, department)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, role, department;
        `;
        const values = [id, body.username, body.password, body.role, body.department];
        
        const result = await query(insertQuery, values);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating user. Raw error:", error);
        if (error.code === '23505') { 
            return NextResponse.json({ error: `Користувач з іменем '${error.detail.match(/\((.*?)\)/)?.[1] || ''}' вже існує.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Не вдалося створити користувача.' }, { status: 500 });
    }
}
