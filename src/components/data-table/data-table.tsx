
"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type TableMeta,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { EquipmentFormData, Option } from "@/types"; 

interface CustomTableMeta<TData> extends TableMeta<TData> {
  onEditItem?: (item: TData) => void;
  onDeleteItem?: (item: TData) => void;
  isUserLoggedIn: boolean; 
}


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddEquipment?: (newEquipment: EquipmentFormData) => void;
  filterCategories?: Option[];
  filterLocations?: Option[];
  onEditItem?: (item: TData) => void;
  onDeleteItem?: (item: TData) => void;
  isUserLoggedIn: boolean;
  toolbarContent?: React.ReactNode;
}

function DataTableComponent<TData, TValue>({
  columns: initialColumns,
  data,
  onAddEquipment,
  filterCategories,
  filterLocations,
  onEditItem,
  onDeleteItem,
  isUserLoggedIn, 
  toolbarContent,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo(
    () =>
      isUserLoggedIn
        ? initialColumns
        : initialColumns.filter((column) => column.id !== "actions"),
    [initialColumns, isUserLoggedIn]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    meta: { 
      onEditItem: onEditItem,
      onDeleteItem: onDeleteItem,
      isUserLoggedIn, 
    } as CustomTableMeta<TData>, 
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      { toolbarContent ? ( <div className="flex items-center justify-end">{toolbarContent}</div> )
      : (filterCategories && filterLocations) ? (
        <DataTableToolbar 
          table={table} 
          onAddEquipment={onAddEquipment} 
          filterCategories={filterCategories}
          filterLocations={filterLocations}
          isUserLoggedIn={isUserLoggedIn} 
        />
       ) : null}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{width: header.getSize() !== 150 ? undefined : `${header.getSize()}px`}} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-2 sm:p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Немає даних.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;
