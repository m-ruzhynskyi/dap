
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Equipment } from '@/types';
import { randomUUID } from 'crypto';
import { getSessionData } from '@/lib/auth';

export async function GET() {
  try {
    const result = await query('SELECT id, name, "inventoryNumber", category, location, "dateAdded", "createdAt", "updatedAt" FROM equipment ORDER BY "createdAt" DESC');
    const equipment = result.rows.map(item => ({
      ...item,
      dateAdded: item.dateAdded ? new Date(item.dateAdded).toISOString().split('T')[0] : null,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    }));
    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error("Error fetching equipment. Raw error:", error); 
    let errorMessage = 'Не вдалося завантажити техніку. Сталася неочікувана помилка.';
    let statusCode = 500;

    if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.code === '42P01') {
        errorMessage = "Таблицю 'equipment' не знайдено в базі даних. Будь ласка, переконайтеся, що таблицю створено та схема правильна.";
    } else if (error.message) { 
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function POST(request: Request) {
  const session = await getSessionData();
  if (!session?.isLoggedIn) {
    return NextResponse.json({ error: 'Не авторизовано: Ви повинні увійти в систему, щоб додати техніку.' }, { status: 401 });
  }

  try {
    const body: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    if (!body.name || !body.inventoryNumber || !body.category || !body.location || !body.dateAdded) {
      return NextResponse.json({ error: 'Відсутні обов\'язкові поля' }, { status: 400 });
    }
    
    const id = randomUUID();
    const now = new Date();
    
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

    const newEquipment: Equipment = {
      id,
      name: body.name,
      inventoryNumber: body.inventoryNumber,
      category: body.category,
      location: body.location,
      dateAdded: dateAddedString,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const insertQuery = `
      INSERT INTO equipment (id, name, "inventoryNumber", category, location, "dateAdded", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      newEquipment.id,
      newEquipment.name,
      newEquipment.inventoryNumber,
      newEquipment.category,
      newEquipment.location,
      newEquipment.dateAdded,
      newEquipment.createdAt,
      newEquipment.updatedAt,
    ];

    const result = await query(insertQuery, values);
    
    if (result.rows.length > 0) {
      const addedItemRow = result.rows[0];
      const addedItem = {
        ...addedItemRow,
        dateAdded: addedItemRow.dateAdded ? new Date(addedItemRow.dateAdded).toISOString().split('T')[0] : null,
        createdAt: new Date(addedItemRow.createdAt).toISOString(),
        updatedAt: new Date(addedItemRow.updatedAt).toISOString(),
      };
      return NextResponse.json(addedItem, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Не вдалося створити запис техніки, дані не повернуто після вставки.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Error creating equipment. Raw error:", error); 
    let errorMessage = 'Не вдалося створити запис техніки. Сталася неочікувана помилка.';
    let statusCode = 500;
    let requestBodyForErrorLog: any; 
    try {
        requestBodyForErrorLog = await request.json(); 
    } catch { 
        requestBodyForErrorLog = 'Could not parse request body'; 
    }


    if (error instanceof SyntaxError) { 
        errorMessage = 'Невірний JSON запит.';
        statusCode = 400;
    } else if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.code === '23505') { 
        errorMessage = `Інвентарний номер '${requestBodyForErrorLog?.inventoryNumber || ''}' вже існує.`;
        statusCode = 409;
    } else if (error.code === '42P01') { 
        errorMessage = "Таблицю 'equipment' не знайдено в базі даних. Будь ласка, переконайтеся, що таблицю створено.";
    } else if (error.message && (error.message.toLowerCase().includes('invalid date format') || error.message.toLowerCase().includes('invalid date value'))) {
        errorMessage = error.message; 
        statusCode = 400;
    } else if (error.message) { 
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
