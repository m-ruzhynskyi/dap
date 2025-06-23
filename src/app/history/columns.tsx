
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { HistoryEntry } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: "action",
    header: "Дія",
    cell: ({ row }) => {
      const action = row.getValue("action") as HistoryEntry['action'];
      let variant: "default" | "secondary" | "destructive" = "secondary";
      if (action === "Створено") variant = "default";
      if (action === "Видалено") variant = "destructive";

      return <Badge variant={variant} className="whitespace-nowrap">{action}</Badge>;
    },
    size: 100,
  },
  {
    accessorKey: "equipment_name",
    header: "Назва техніки",
     cell: ({ row }) => <div className="font-medium">{row.getValue("equipment_name")}</div>,
  },
  {
    accessorKey: "details",
    header: "Деталі",
    cell: ({ row }) => {
      const details = row.getValue("details") as string;
      const shortDetails = details.length > 80 ? `${details.substring(0, 80)}...` : details;
      
      return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">{shortDetails}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                    <p>{details}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      )
    }
  },
  {
    accessorKey: "changed_by",
    header: "Користувач",
  },
  {
    accessorKey: "changed_at",
    header: "Дата зміни",
    cell: ({ row }) => {
      const dateValue = row.getValue("changed_at") as string;
      const date = new Date(dateValue);
      return <div className="whitespace-nowrap">{date.toLocaleString('uk-UA')}</div>
    },
    size: 150,
  },
]
