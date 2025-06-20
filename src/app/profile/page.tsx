
"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { User, Building, Settings, LogOut } from "lucide-react"
import type { UserSession } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton" 
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()
  const pathname = usePathname() 
  const { toast } = useToast()

  const fetchUser = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/user', { cache: 'no-store' });
      if (response.ok) {
        const data: UserSession = await response.json()
        if (!data.isLoggedIn) {
          toast({ variant: "destructive", title: "Не автентифіковано", description: "Будь ласка, увійдіть, щоб переглянути свій профіль."})
          router.push('/login') 
        } else {
          setCurrentUser(data)
        }
      } else {
        toast({ variant: "destructive", title: "Помилка", description: "Не вдалося завантажити дані користувача. Перенаправлення на сторінку входу."})
        router.push('/login') 
      }
    } catch (error) {
      console.error("Failed to fetch user session:", error)
      toast({ variant: "destructive", title: "Помилка", description: "Сталася неочікувана помилка. Перенаправлення на сторінку входу."})
      router.push('/login') 
    } finally {
      setIsLoading(false)
    }
  }, [router, toast]); 

  React.useEffect(() => {
    fetchUser()
  }, [fetchUser, pathname]) 


  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        toast({ title: "Вихід виконано", description: "Ви успішно вийшли з системи." })
        setCurrentUser(null) 
        router.push('/login') 
        router.refresh()
      } else {
        toast({ variant: "destructive", title: "Помилка виходу", description: "Не вдалося вийти з системи. Будь ласка, спробуйте ще раз." })
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast({ variant: "destructive", title: "Помилка виходу", description: "Сталася неочікувана помилка." })
    }
  }

  if (isLoading || !currentUser?.isLoggedIn) { 
    return (
      <div className="container mx-auto max-w-2xl py-10">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src="https://placehold.co/100x100.png" alt="Аватар користувача" data-ai-hint="user avatar" />
            <AvatarFallback>{currentUser.username?.substring(0,2).toUpperCase() || 'IT'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentUser.username || 'IT Адміністратор'}</CardTitle>
          <CardDescription>TechTracker Enterprise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-muted-foreground">Інформація</h3>
            <Separator />
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <p>Ім'я користувача: <span className="font-medium">{currentUser.username}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <p>Відділ: <span className="font-medium">Інформаційні Технології</span></p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-muted-foreground">Налаштування</h3>
            <Separator />
            <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Редагувати профіль (недоступно)
            </Button>
             <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Змінити пароль (недоступно)
            </Button>
          </div>

          <Separator />
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Вийти з системи
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
