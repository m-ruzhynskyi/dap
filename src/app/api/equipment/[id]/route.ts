
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Equipment } from '@/types';
import { getSessionData } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const result = await query('SELECT id, name, "inventoryNumber", category, location, "dateAdded", "createdAt", "updatedAt" FROM equipment WHERE id = $1', [id]);
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
    console.error(`Error fetching equipment with ID ${id}. Raw error:`, error);
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
  if (!session?.isLoggedIn) {
    return NextResponse.json({ error: 'Не авторизовано: Ви повинні увійти в систему, щоб оновити техніку.' }, { status: 401 });
  }

  const { id } = params;
  let body: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;

  try {
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
      SET name = $1, "inventoryNumber" = $2, category = $3, location = $4, "dateAdded" = $5, "updatedAt" = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const values = [
      body.name,
      body.inventoryNumber,
      body.category,
      body.location,
      dateAddedString, 
      id,
    ];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Техніку не знайдено або не оновлено' }, { status: 404 });
    }
    
    const updatedItemRow = result.rows[0];
    const updatedItem = {
        ...updatedItemRow,
        dateAdded: updatedItemRow.dateAdded ? new Date(updatedItemRow.dateAdded).toISOString().split('T')[0] : null,
        createdAt: new Date(updatedItemRow.createdAt).toISOString(),
        updatedAt: new Date(updatedItemRow.updatedAt).toISOString(),
    };
    return NextResponse.json(updatedItem, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating equipment with ID ${id}. Raw error:`, error);
    let errorMessage = `Не вдалося оновити техніку з ID ${id}. Сталася неочікувана помилка.`;
    let statusCode = 500;
    
    let requestBodyForErrorLog: any = body; 
    try {
        
        requestBodyForErrorLog = await request.json(); 
    } catch { 
        
        requestBodyForErrorLog = 'Could not parse request body for error log'; 
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
  if (!session?.isLoggedIn) {
    return NextResponse.json({ error: 'Не авторизовано: Ви повинні увійти в систему, щоб видалити техніку.' }, { status: 401 });
  }

  const { id } = params;
  try {
    const result = await query('DELETE FROM equipment WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Техніку не знайдено' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Техніку успішно видалено' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting equipment with ID ${id}. Raw error:`, error);
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
