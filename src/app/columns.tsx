
"use client"

import type { ColumnDef, TableMeta } from "@tanstack/react-table"
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Equipment } from "@/types"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES as PREDEFINED_CATEGORIES } from "./equipment-data" 

interface EquipmentTableMeta<TData> extends TableMeta<TData> {
  onEditItem?: (item: TData) => void;
  onDeleteItem?: (item: TData) => void;
  isUserLoggedIn: boolean; 
}


export const columns: ColumnDef<Equipment>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Назва техніки" />
    ),
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[100px] sm:max-w-[150px] md:max-w-xs lg:max-w-md xl:max-w-lg">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "inventoryNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Інв. номер" />
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[70px] sm:max-w-[100px] md:max-w-xs"> 
        {row.getValue("inventoryNumber")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Категорія" />
    ),
    cell: ({ row }) => {
      const categoryValue = row.getValue("category") as string;
      const categoryOption = PREDEFINED_CATEGORIES.find(
        (cat) => cat.value.toLowerCase() === categoryValue.toLowerCase()
      )
      return (
        <div className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-xs">
          {!categoryOption ? (
             <Badge variant="outline" className="capitalize whitespace-nowrap">{categoryValue}</Badge>
          ) : (
            <Badge variant="outline" className="capitalize whitespace-nowrap">
              {categoryOption.icon && <categoryOption.icon className="mr-1 h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />}
              {categoryOption.label}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "location",
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Кабінет" />
    ),
    cell: ({ row }) => {
        const locationValue = row.getValue("location") as string;
        return (
          <div className="capitalize truncate max-w-[70px] sm:max-w-[120px] md:max-w-xs">
            {locationValue}
          </div>
        );
    },
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "dateAdded",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Дата обліку" />
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("dateAdded");
      const date = typeof dateValue === 'string' ? new Date(dateValue) : (dateValue as Date);

      if (isNaN(date.getTime())) { 
        return <div className="min-w-[70px]">Невірна дата</div>;
      }
      const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()+1);
      return <div className="min-w-[70px] whitespace-nowrap">{adjustedDate.toLocaleDateString('uk-UA')}</div>
    },
  },
  {
    accessorKey: "createdBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Створив" />
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[100px]">{row.getValue("createdBy")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const equipment = row.original;
      const meta = table.options.meta as EquipmentTableMeta<Equipment>;
      const isUserLoggedIn = meta?.isUserLoggedIn || false;

      if (!isUserLoggedIn) {
        return null; 
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Відкрити меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Дії</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => meta.onEditItem?.(equipment)}
              disabled={!meta.onEditItem} 
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Редагувати
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => meta.onDeleteItem?.(equipment)}
              disabled={!meta.onDeleteItem} 
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Видалити
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false, 
    size: 40, 
  },
]
