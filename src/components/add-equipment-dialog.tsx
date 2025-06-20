
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { CalendarIcon, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { Equipment } from "@/types"

const equipmentFormSchema = z.object({
  name: z.string().min(2, { message: "Назва має містити щонайменше 2 символи." }),
  inventoryNumber: z.string().min(1, { message: "Інвентарний номер обов'язковий." }),
  category: z.string().min(1, { message: "Категорія обов'язкова." }),
  location: z.string().min(1, { message: "Кабінет обов'язковий." }),
  dateAdded: z.date({ required_error: "Дата обліку обов'язкова." }),
})

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>

interface AddEquipmentDialogProps {
  onEquipmentAdd: (newEquipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AddEquipmentDialog({ onEquipmentAdd }: AddEquipmentDialogProps) {
  const [open, setOpen] = React.useState(false)

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      inventoryNumber: "",
      category: "",
      location: "",
      dateAdded: new Date(),
    },
  })

  async function onSubmit(data: EquipmentFormValues) {
    onEquipmentAdd(data); 
    form.reset({ name: "", inventoryNumber: "", category: "", location: "", dateAdded: new Date() });
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-9">
          <PlusCircle className="mr-2 h-4 w-4" />
          Додати техніку
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Додати нову техніку</DialogTitle>
          <DialogDescription>
            Заповніть форму нижче, щоб додати нову одиницю техніки.
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
                  <FormItem>
                    <FormLabel>Категорія</FormLabel>
                    <FormControl>
                        <Input placeholder="Наприклад, Ноутбуки" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Кабінет</FormLabel>
                     <FormControl>
                        <Input placeholder="Наприклад, Кабінет 101" {...field} />
                    </FormControl>
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
                <Button type="button" variant="outline">
                  Скасувати
                </Button>
              </DialogClose>
              <Button type="submit">Додати техніку</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
