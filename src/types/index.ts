
export interface Equipment {
  id: string;
  name: string;
  inventoryNumber: string;
  category: string;
  location: string;
  dateAdded: Date | string; 
  createdAt?: Date | string; 
  updatedAt?: Date | string; 
}

export type EquipmentFormData = Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface UserSession {
  username?: string;
  isLoggedIn?: boolean;
}
