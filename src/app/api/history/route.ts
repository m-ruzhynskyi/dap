
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { HistoryEntry } from '@/types';

export async function GET() {
  try {
    const result = await query('SELECT id, action, equipment_id, equipment_name, equipment_inventory_number, details, changed_by, changed_at FROM equipment_history ORDER BY "changed_at" DESC');
    const history: HistoryEntry[] = result.rows.map(item => ({
      ...item,
      changed_at: new Date(item.changed_at).toISOString(),
    }));
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Помилка завантаження історії. Помилка:", error); 
    let errorMessage = 'Не вдалося завантажити історію. Сталася неочікувана помилка.';
    let statusCode = 500;

    if (error.code === '42P01') {
        errorMessage = "Таблицю 'equipment_history' не знайдено в базі даних. Будь ласка, переконайтеся, що ви виконали скрипт міграції.";
    } else if (error.message) { 
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
