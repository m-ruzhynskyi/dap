
"use client"

import type { ColumnDef, TableMeta } from "@tanstack/react-table"
import { MoreHorizontal, Edit2, Trash2, User as UserIcon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/types"
import { Badge } from "@/components/ui/badge"

interface UserTableMeta<TData> extends TableMeta<TData> {
  onEditItem?: (item: TData) => void
  onDeleteItem?: (item: TData) => void
  isUserLoggedIn: boolean
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "username",
    header: "Ім'я користувача",
    cell: ({ row }) => <div className="font-medium">{row.getValue("username")}</div>,
  },
  {
    accessorKey: "department",
    header: "Відділ",
  },
  {
    accessorKey: "role",
    header: "Роль",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === "admin" ? "destructive" : "secondary"}>
          {role === "admin" ? <Shield className="mr-1 h-3.5 w-3.5" /> : <UserIcon className="mr-1 h-3.5 w-3.5" />}
          {role}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original
      const meta = table.options.meta as UserTableMeta<User>

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
            <DropdownMenuItem onClick={() => meta.onEditItem?.(user)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Редагувати
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => meta.onDeleteItem?.(user)}
              disabled={user.role === 'admin'} 
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Видалити
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
