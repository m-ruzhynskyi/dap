
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { User, UserFormData } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const userFormSchema = z.object({
  username: z.string().min(3, { message: "Ім'я користувача має бути не менше 3 символів." }),
  password: z.string().optional(),
  department: z.string().min(2, { message: "Відділ є обов'язковим." }),
  role: z.enum(["admin", "user"], { required_error: "Роль є обов'язковою." }),
})

interface UserDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: UserFormData, id?: string) => void
  userToEdit: User | null
}

export function UserDialog({ isOpen, onOpenChange, onSave, userToEdit }: UserDialogProps) {
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      department: "",
      role: "user",
    },
  })

  React.useEffect(() => {
    if (userToEdit && isOpen) {
      form.reset({
        username: userToEdit.username,
        password: "", 
        department: userToEdit.department,
        role: userToEdit.role,
      })
    } else if (!userToEdit && isOpen) {
        form.reset({
            username: "",
            password: "",
            department: "",
            role: "user",
        })
    }
  }, [userToEdit, isOpen, form])

  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    const dataToSave: UserFormData = { ...data };
    if (!data.password) {
        delete dataToSave.password;
    }
    onSave(dataToSave, userToEdit?.id)
  }

  const isEditing = !!userToEdit;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Редагувати користувача" : "Створити користувача"}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Оновлення даних для ${userToEdit.username}` : "Створення нового облікового запису."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ім'я користувача</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditing ? "Залиште пустим, щоб не змінювати" : ""} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Відділ</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing && userToEdit.role === 'admin'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Скасувати
              </Button>
              <Button type="submit">Зберегти</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
