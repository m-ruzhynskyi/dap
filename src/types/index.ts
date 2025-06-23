
export interface Equipment {
  id: string;
  name: string;
  inventoryNumber: string;
  category: string;
  location: string;
  dateAdded: Date | string; 
  createdAt?: Date | string; 
  updatedAt?: Date | string; 
  createdBy?: string;
  lastModifiedBy?: string;
}

export type EquipmentFormData = Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy'>;

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  department: string;
}

export type UserFormData = Omit<User, 'id'>;

export interface UserSession {
  id?: string;
  username?: string;
  isLoggedIn?: boolean;
  role?: 'admin' | 'user';
  department?: string;
}

export interface HistoryEntry {
  id: string;
  action: 'Створено' | 'Оновлено' | 'Видалено';
  equipment_id: string;
  equipment_name: string;
  details: string;
  changed_by: string;
  changed_at: string;
}
