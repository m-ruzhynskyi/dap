
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT DISTINCT category FROM equipment ORDER BY category ASC');
    const categories = result.rows.map(row => row.category);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching categories. Raw error:", error);
    let errorMessage = 'Не вдалося завантажити категорії. Сталася неочікувана помилка.';
    let statusCode = 500;

    if (error.message && error.message.includes("DATABASE_URL environment variable is not set")) {
        errorMessage = "Підключення до бази даних не налаштовано: відсутня змінна DATABASE_URL.";
    } else if (error.message && error.message.includes("Database pool not initialized")) {
        errorMessage = "Не вдалося ініціалізувати підключення до бази даних. Перевірте логи сервера.";
    } else if (error.code === '42P01') { 
        errorMessage = "Таблицю 'equipment' не знайдено в базі даних. Неможливо завантажити категорії. Будь ласка, переконайтеся, що таблицю створено.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
