
"use client"

import type { Table } from "@tanstack/react-table"
import { FileDown, X } from "lucide-react"
import * as XLSX from 'xlsx';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import type { Option, EquipmentFormData, Equipment } from "@/types"
import { AddEquipmentDialog } from "@/components/add-equipment-dialog"

interface DataTableToolbarProps<TData extends { id: string }> {
  table: Table<TData>
  onAddEquipment?: (newEquipment: EquipmentFormData) => void;
  filterCategories: Option[];
  filterLocations: Option[];
  isUserLoggedIn: boolean;
}

export function DataTableToolbar<TData extends { id: string }>({
  table,
  onAddEquipment,
  filterCategories,
  filterLocations,
  isUserLoggedIn,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const handleExport = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => {
        const original = row.original as unknown as Equipment;
        return {
            name: original.name,
            inventoryNumber: original.inventoryNumber,
            category: original.category,
            location: original.location,
            dateAdded: original.dateAdded,
            createdBy: original.createdBy,
        }
    });

    if (!dataToExport || !dataToExport.length) {
      return;
    }

    const columnDefinitions = [
      { key: 'name', title: 'Назва техніки', width: 35 },
      { key: 'inventoryNumber', title: 'Інв. номер', width: 15 },
      { key: 'category', title: 'Категорія', width: 25 },
      { key: 'location', title: 'Кабінет', width: 20 },
      { key: 'dateAdded', title: 'Дата обліку', width: 15 },
      { key: 'createdBy', title: 'Створив', width: 20 },
    ];

    const headerRow = columnDefinitions.map(h => h.title);

    const dataRows = dataToExport.map(item => {
      return columnDefinitions.map(header => {
        let cellValue = item[header.key as keyof typeof item];

        if (header.key === 'dateAdded') {
          if (cellValue) {
            const date = typeof cellValue === 'string' ? new Date(cellValue) : (cellValue as Date);
            if (!isNaN(date.getTime())) {
              const day = date.getUTCDate().toString().padStart(2, '0');
              const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
              const year = date.getUTCFullYear();
              return `${day}.${month}.${year}`;
            } else {
              return ''; 
            }
          } else {
            return ''; 
          }
        }
        return cellValue === null || cellValue === undefined ? '' : String(cellValue);
      });
    });
    
    const worksheetData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const commonBorderStyle = {
      top: { style: "thin", color: { rgb: "000000" } }, 
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const headerCellStyleDef = {
      font: { bold: true, name: "Arial", sz: 11, color: { rgb: "FFFFFF" } }, 
      alignment: { horizontal: "center", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "4F81BD" } }, 
      border: commonBorderStyle,
    };

    const dataCellStyleDef = {
      font: { name: "Arial", sz: 10, color: { rgb: "000000" } }, 
      border: commonBorderStyle,
      alignment: { vertical: "center" } 
    };
    
    for (let R = 0; R < worksheetData.length; ++R) {
      for (let C = 0; C < headerRow.length; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        
        if (!ws[cell_address]) {
           ws[cell_address] = { v: worksheetData[R][C] !== undefined ? worksheetData[R][C] : "", t: 's' };
        } else {
            if (ws[cell_address].v === undefined && worksheetData[R][C] !== undefined) {
                ws[cell_address].v = worksheetData[R][C];
            }
            if (!ws[cell_address].t && typeof ws[cell_address].v === 'string') {
                ws[cell_address].t = 's';
            } else if (!ws[cell_address].t && typeof ws[cell_address].v === 'number') {
                ws[cell_address].t = 'n';
            }
        }
        
        if (R === 0) { 
          ws[cell_address].s = JSON.parse(JSON.stringify(headerCellStyleDef)); 
        } else { 
          ws[cell_address].s = JSON.parse(JSON.stringify(dataCellStyleDef)); 
          
          const dateColumnIndex = columnDefinitions.findIndex(col => col.key === 'dateAdded');
          if (C === dateColumnIndex && ws[cell_address].v) {
            ws[cell_address].t = 's'; 
          }
        }
      }
    }

    ws['!cols'] = columnDefinitions.map(h => ({ wch: h.width }));

    if (worksheetData.length > 0 && headerRow.length > 0) {
        const headerRange = { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } };
        ws['!autofilter'] = { ref: XLSX.utils.encode_range(headerRange) };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ОблікТехніки");

    XLSX.writeFile(wb, "TechTracker_Export.xlsx");
  };

  return (
    <div className="flex flex-col items-center justify-between gap-y-2 py-4 sm:flex-row sm:gap-y-0">
      <div className="flex w-full flex-1 flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
        <Input
          placeholder="Фільтр за назвою..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-9 w-full sm:max-w-xs"
        />
        {table.getColumn("category") && (
          <DataTableFacetedFilter
            column={table.getColumn("category")}
            title="Категорія"
            options={filterCategories}
          />
        )}
        {table.getColumn("location") && (
          <DataTableFacetedFilter
            column={table.getColumn("location")}
            title="Кабінет"
            options={filterLocations}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Очистити
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex w-full items-center justify-start space-x-2 sm:w-auto sm:justify-end">
        <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleExport}
            disabled={!isUserLoggedIn}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Експорт XLSX
        </Button>
        {isUserLoggedIn && onAddEquipment && (
          <AddEquipmentDialog 
            onEquipmentAdd={onAddEquipment} 
            categoryOptions={filterCategories}
            locationOptions={filterLocations}
          />
        )}
      </div>
    </div>
  )
}
