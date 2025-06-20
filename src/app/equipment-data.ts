
import type { Equipment, Option } from "@/types";
import { Laptop, Monitor, Printer, Server, Network, Smartphone, Tablet, Projector, HelpCircle } from 'lucide-react'; 

export const CATEGORIES: Option[] = [
  { value: 'Laptops', label: 'Ноутбуки', icon: Laptop },
  { value: 'Printers', label: 'Принтери', icon: Printer },
  { value: 'Monitors', label: 'Монітори', icon: Monitor },
  { value: 'Servers', label: 'Сервери', icon: Server },
  { value: 'Networking', label: 'Мережеве обладнання', icon: Network },
  { value: 'Smartphones', label: 'Смартфони', icon: Smartphone },
  { value: 'Tablets', label: 'Планшети', icon: Tablet },
  { value: 'Projectors', label: 'Проектори', icon: Projector },
  { value: 'Peripherals', label: 'Периферія', icon: Laptop }, 
  { value: 'Other', label: 'Інше', icon: HelpCircle }, 
];

export const LOCATIONS: Option[] = [
  { value: 'Office 101', label: 'Кабінет 101' },
  { value: 'Office 102', label: 'Кабінет 102' },
  { value: 'Office 205', label: 'Кабінет 205' },
  { value: 'Office 303', label: 'Кабінет 303' },
  { value: 'Remote WFH', label: 'Віддалено' },
  { value: 'Server Room A', label: 'Серверна А' },
  { value: 'Meeting Room 1', label: 'Кімната для зустрічей 1' },
  { value: 'Management', label: 'Керівництво' },
  { value: 'Sales Team', label: 'Відділ продажів' },
  { value: 'Warehouse', label: 'Склад' }, 
];
