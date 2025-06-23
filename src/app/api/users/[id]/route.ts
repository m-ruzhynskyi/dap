
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionData } from '@/lib/auth';
import type { UserFormData } from '@/types';

async function checkAdmin(request: Request) {
    const session = await getSessionData();
    if (!session?.isLoggedIn || session.role !== 'admin') {
        return new NextResponse(JSON.stringify({ error: 'Не авторизовано або недостатньо прав.' }), { status: 403 });
    }
    return null;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const adminError = await checkAdmin(request);
    if (adminError) return adminError;

    const { id } = params;
    try {
        const body: Partial<UserFormData> = await request.json();
        
        const fieldsToUpdate = [];
        const values = [];
        let queryIndex = 1;

        if (body.username) {
            fieldsToUpdate.push(`username = $${queryIndex++}`);
            values.push(body.username);
        }
        if (body.password) {
            fieldsToUpdate.push(`password = $${queryIndex++}`);
            values.push(body.password);
        }
        if (body.department) {
            fieldsToUpdate.push(`department = $${queryIndex++}`);
            values.push(body.department);
        }
        if (body.role) {
            fieldsToUpdate.push(`role = $${queryIndex++}`);
            values.push(body.role);
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'Немає полів для оновлення' }, { status: 400 });
        }
        
        values.push(id);
        const updateQuery = `
            UPDATE users SET ${fieldsToUpdate.join(', ')}
            WHERE id = $${queryIndex}
            RETURNING id, username, role, department;
        `;
        
        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Користувача не знайдено або не оновлено' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error(`Error updating user ${id}. Raw error:`, error);
        if (error.code === '23505') { 
            return NextResponse.json({ error: `Користувач з іменем '${error.detail.match(/\((.*?)\)/)?.[1] || ''}' вже існує.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Не вдалося оновити користувача.' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const adminError = await checkAdmin(request);
    if (adminError) return adminError;

    const { id } = params;
    try {
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Користувача успішно видалено' }, { status: 200 });
    } catch (error: any) {
        console.error(`Error deleting user ${id}. Raw error:`, error);
        return NextResponse.json({ error: 'Не вдалося видалити користувача.' }, { status: 500 });
    }
}
