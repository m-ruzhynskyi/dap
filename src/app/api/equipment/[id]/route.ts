
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Equipment } from '@/types';
import { getSessionData } from '@/lib/auth';
import { normalizeString } from '@/lib/utils';
import { randomUUID } from 'crypto';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const result = await query('SELECT id, name, "inventoryNumber", category, location, "dateAdded", "createdAt", "updatedAt", "createdBy", "lastModifiedBy" FROM equipment WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Техніку не знайдено' }, { status: 404 });
    }
    const item = result.rows[0];
    const equipment = {
        ...item,
        dateAdded: item.dateAdded ? new Date(item.dateAdded).toISOString().split('T')[0] : null,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    };
    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error(`Помилка завантаження техніки з ID ${id}. Помилка:`, error);
    let errorMessage = `Не вдалося завантажити техніку з ID ${id}. Сталася неочікувана помилка.`;
     if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionData();
  if (!session?.isLoggedIn || session.role !== 'user') {
    return NextResponse.json({ error: 'Не авторизовано або недостатньо прав для оновлення техніки.' }, { status: 403 });
  }

  const { id } = params;
  let body: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy'>;

  try {
    const beforeResult = await query('SELECT * FROM equipment WHERE id = $1', [id]);
    if (beforeResult.rows.length === 0) {
        return NextResponse.json({ error: 'Техніку для оновлення не знайдено' }, { status: 404 });
    }
    const beforeItem = beforeResult.rows[0];

    body = await request.json();
    if (!body.name || !body.inventoryNumber || !body.category || !body.location || !body.dateAdded) {
      return NextResponse.json({ error: 'Відсутні обов\'язкові поля' }, { status: 400 });
    }

    const dateAddedString = body.dateAdded as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateAddedString)) {
        return NextResponse.json({ error: 'Невірний формат дати для dateAdded. Очікується РРРР-ММ-ДД.' }, { status: 400 });
    }
    const dateParts = dateAddedString.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

    if (isNaN(parsedDate.getTime()) ||
        parsedDate.getUTCFullYear() !== dateParts[0] ||
        parsedDate.getUTCMonth() !== dateParts[1] - 1 ||
        parsedDate.getUTCDate() !== dateParts[2]) {
        return NextResponse.json({ error: 'Невірне значення дати для dateAdded (наприклад, місяць або день поза діапазоном).' }, { status: 400 });
    }

    const updateQuery = `
      UPDATE equipment
      SET name = $1, "inventoryNumber" = $2, category = $3, location = $4, "dateAdded" = $5, "updatedAt" = NOW(), "lastModifiedBy" = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [
      body.name,
      body.inventoryNumber,
      normalizeString(body.category),
      normalizeString(body.location),
      dateAddedString,
      session.username,
      id,
    ];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Техніку не знайдено або не оновлено' }, { status: 404 });
    }
    
    const updatedItemRow = result.rows[0];

    const changes = [];
    if (beforeItem.name !== updatedItemRow.name) changes.push(`назву з "${beforeItem.name}" на "${updatedItemRow.name}"`);
    if (beforeItem.inventoryNumber !== updatedItemRow.inventoryNumber) changes.push(`інв. номер з "${beforeItem.inventoryNumber}" на "${updatedItemRow.inventoryNumber}"`);
    if (beforeItem.category !== updatedItemRow.category) changes.push(`категорію з "${beforeItem.category}" на "${updatedItemRow.category}"`);
    if (beforeItem.location !== updatedItemRow.location) changes.push(`кабінет з "${beforeItem.location}" на "${updatedItemRow.location}"`);
    const beforeDate = new Date(beforeItem.dateAdded).toISOString().split('T')[0];
    if (beforeDate !== dateAddedString) changes.push(`дату обліку з "${beforeDate}" на "${dateAddedString}"`);
    
    if (changes.length > 0) {
        const historyDetails = `Оновлено: ${changes.join(', ')}.`;
        const historyQuery = `
            INSERT INTO equipment_history (id, action, equipment_id, equipment_name, details, changed_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await query(historyQuery, [randomUUID(), 'Оновлено', updatedItemRow.id, updatedItemRow.name, historyDetails, session.username]);
    }

    const updatedItem = {
        ...updatedItemRow,
        dateAdded: updatedItemRow.dateAdded ? new Date(updatedItemRow.dateAdded).toISOString().split('T')[0] : null,
        createdAt: new Date(updatedItemRow.createdAt).toISOString(),
        updatedAt: new Date(updatedItemRow.updatedAt).toISOString(),
    };
    return NextResponse.json(updatedItem, { status: 200 });

  } catch (error: any) {
    console.error(`Помилка оновлення техніки з ID ${id}. Помилка:`, error);
    let errorMessage = `Не вдалося оновити техніку з ID ${id}. Сталася неочікувана помилка.`;
    let statusCode = 500;
    
    let requestBodyForErrorLog: any; 
    try {
        requestBodyForErrorLog = await request.json(); 
    } catch { 
        requestBodyForErrorLog = 'Не вдалося розібрати тіло запиту для логування помилки'; 
    }

    if (error instanceof SyntaxError) {
        errorMessage = 'Невірний JSON запит.';
        statusCode = 400;
    } else if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.code === '23505' && error.constraint === 'equipment_inventoryNumber_key') {
        errorMessage = `Інвентарний номер '${requestBodyForErrorLog?.inventoryNumber || ''}' вже існує для іншого запису.`;
        statusCode = 409;
    } else if (error.code === '23505') { 
        errorMessage = `Порушено унікальне обмеження. Перевірте інвентарний номер.`;
        statusCode = 409;
    } else if (error.message && (error.message.toLowerCase().includes('invalid date format') || error.message.toLowerCase().includes('invalid date value'))) {
        errorMessage = error.message; 
        statusCode = 400;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionData();
  if (!session?.isLoggedIn || session.role !== 'user') {
    return NextResponse.json({ error: 'Не авторизовано або недостатньо прав для видалення техніки.' }, { status: 403 });
  }

  const { id } = params;
  try {
    const beforeResult = await query('SELECT id, name, "inventoryNumber" FROM equipment WHERE id = $1', [id]);
    if (beforeResult.rows.length === 0) {
        return NextResponse.json({ error: 'Техніку для видалення не знайдено' }, { status: 404 });
    }
    const itemToDelete = beforeResult.rows[0];

    const result = await query('DELETE FROM equipment WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Техніку не знайдено' }, { status: 404 });
    }

    const historyDetails = `Видалено техніку: "${itemToDelete.name}" (Інв. номер: ${itemToDelete.inventoryNumber}).`;
    const historyQuery = `
        INSERT INTO equipment_history (id, action, equipment_id, equipment_name, details, changed_by)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await query(historyQuery, [randomUUID(), 'Видалено', itemToDelete.id, itemToDelete.name, historyDetails, session.username]);

    return NextResponse.json({ message: 'Техніку успішно видалено' }, { status: 200 });
  } catch (error: any) {
    console.error(`Помилка видалення техніки з ID ${id}. Помилка:`, error);
    let errorMessage = `Не вдалося видалити техніку з ID ${id}. Сталася неочікувана помилка.`;
    if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
