
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Equipment, EquipmentFormData, Option } from "@/types"
import { Combobox } from "@/components/ui/combobox"

const equipmentFormSchema = z.object({
  name: z.string().min(2, { message: "Назва має містити щонайменше 2 символи." }),
  inventoryNumber: z.string().min(1, { message: "Інвентарний номер обов'язковий." }),
  category: z.string().min(1, { message: "Категорія обов'язкова." }),
  location: z.string().min(1, { message: "Кабінет обов'язковий." }),
  dateAdded: z.date({ required_error: "Дата обліку обов'язкова." }),
})

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>

interface EditEquipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentToEdit: Equipment | null;
  onEquipmentUpdate: (id: string, updatedEquipmentData: EquipmentFormData) => void;
  categoryOptions: Option[];
  locationOptions: Option[];
}

export function EditEquipmentDialog({ 
  isOpen, 
  onOpenChange, 
  equipmentToEdit, 
  onEquipmentUpdate,
  categoryOptions,
  locationOptions,
}: EditEquipmentDialogProps) {
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
  })

  React.useEffect(() => {
    if (equipmentToEdit && isOpen) {
      const dateValue = equipmentToEdit.dateAdded;
      let initialDate: Date;
      if (typeof dateValue === 'string') {
        const parts = dateValue.split('T')[0].split('-').map(Number);
        initialDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      } else {
        initialDate = dateValue;
      }
      form.reset({
        name: equipmentToEdit.name,
        inventoryNumber: equipmentToEdit.inventoryNumber,
        category: equipmentToEdit.category,
        location: equipmentToEdit.location,
        dateAdded: initialDate, 
      })
    }
  }, [equipmentToEdit, form, isOpen]) 

  async function onSubmit(data: EquipmentFormValues) {
    if (!equipmentToEdit) return;
    onEquipmentUpdate(equipmentToEdit.id, data);
    onOpenChange(false); 
  }

  if (!equipmentToEdit) return null; 

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Редагувати техніку</DialogTitle>
          <DialogDescription>
            Оновіть дані для техніки &quot;{equipmentToEdit?.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Назва техніки</FormLabel>
                  <FormControl>
                    <Input placeholder="Наприклад, HP EliteBook 840 G8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inventoryNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Інвентарний номер</FormLabel>
                  <FormControl>
                    <Input placeholder="Наприклад, INV001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Категорія</FormLabel>
                    <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Оберіть категорію..."
                        searchPlaceholder="Пошук категорії..."
                        noResultsText="Категорію не знайдено."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Кабінет</FormLabel>
                     <Combobox
                        options={locationOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Оберіть кабінет..."
                        searchPlaceholder="Пошук кабінету..."
                        noResultsText="Кабінет не знайдено."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateAdded"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата обліку</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: uk })
                          ) : (
                            <span>Оберіть дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={uk}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Скасувати
                </Button>
              </DialogClose>
              <Button type="submit">Оновити техніку</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
