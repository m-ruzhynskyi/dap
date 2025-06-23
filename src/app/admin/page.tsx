
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { User, UserFormData, UserSession } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"
import { DataTable } from "@/components/data-table/data-table"
import { UserDialog } from "./user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"

async function fetchUsers(): Promise<User[]> {
    const res = await fetch("/api/users")
    if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Не вдалося завантажити користувачів")
    }
    return res.json()
}

async function fetchCurrentUser(): Promise<UserSession> {
  const response = await fetch('/api/auth/user', { cache: 'no-store' });
  if (!response.ok) {
    console.error("Не вдалося отримати статус поточного користувача:", response.status, response.statusText);
    return { isLoggedIn: false };
  }
  return response.json();
}

export default function AdminPage() {
    const [users, setUsers] = React.useState<User[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isAuthLoading, setIsAuthLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
    const router = useRouter()
    const { toast } = useToast()

    const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false)
    const [userToEdit, setUserToEdit] = React.useState<User | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null)

    React.useEffect(() => {
        fetchCurrentUser().then(user => {
            if (user?.role !== 'admin') {
                router.push('/');
            } else {
                setCurrentUser(user);
                setIsAuthLoading(false);
            }
        });
    }, [router]);

    const loadUsers = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const fetchedUsers = await fetchUsers()
            setUsers(fetchedUsers)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Помилка завантаження",
                description: error.message,
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    React.useEffect(() => {
      if(!isAuthLoading) {
        loadUsers()
      }
    }, [isAuthLoading, loadUsers])

    const handleOpenAddDialog = React.useCallback(() => {
        setUserToEdit(null)
        setIsUserDialogOpen(true)
    }, [])

    const handleOpenEditDialog = React.useCallback((user: User) => {
        setUserToEdit(user)
        setIsUserDialogOpen(true)
    }, [])

    const handleOpenDeleteDialog = React.useCallback((user: User) => {
        setUserToDelete(user)
        setIsDeleteDialogOpen(true)
    }, [])

    const handleConfirmDelete = React.useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/users/${id}`, { method: "DELETE" })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Не вдалося видалити користувача")
            }
            toast({ title: "Успіх", description: "Користувача успішно видалено." })
            loadUsers()
        } catch (error: any) {
            toast({ variant: "destructive", title: "Помилка", description: error.message })
        }
        setIsDeleteDialogOpen(false)
    }, [toast, loadUsers])

    const handleUserSave = React.useCallback(async (data: UserFormData, id?: string) => {
        const url = id ? `/api/users/${id}` : "/api/users"
        const method = id ? "PUT" : "POST"

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Не вдалося ${id ? "оновити" : "створити"} користувача`)
            }
            toast({ title: "Успіх", description: `Користувача успішно ${id ? "оновлено" : "створено"}.` })
            loadUsers()
        } catch (error: any) {
            toast({ variant: "destructive", title: "Помилка", description: error.message })
        }
        setIsUserDialogOpen(false)
    }, [toast, loadUsers])

    if (isLoading || isAuthLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <Skeleton className="h-10 w-48 mb-4" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Керування користувачами</h1>
            <DataTable
                columns={columns}
                data={users}
                onEditItem={handleOpenEditDialog}
                onDeleteItem={handleOpenDeleteDialog}
                isUserLoggedIn={true}
                toolbarContent={
                    <Button onClick={handleOpenAddDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Додати користувача
                    </Button>
                }
            />
            <UserDialog
                isOpen={isUserDialogOpen}
                onOpenChange={setIsUserDialogOpen}
                onSave={handleUserSave}
                userToEdit={userToEdit}
            />
            <DeleteUserDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirmDelete={handleConfirmDelete}
                userToDelete={userToDelete}
            />
        </div>
    )
}
