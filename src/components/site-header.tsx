"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation" 
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { User, LogOut, LogIn, ShieldCheck, History } from "lucide-react" 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "./ui/avatar"
import type { UserSession } from "@/types" 
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "./ui/skeleton"

export function SiteHeader() {
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
        setCurrentUser(data)
      } else {
        setCurrentUser(null) 
      }
    } catch (error) {
      console.error("Не вдалося завантажити сесію користувача:", error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, []);

  React.useEffect(() => {
    fetchUser()
  }, [fetchUser, pathname]) 

  const handleLogout = React.useCallback(async () => {
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
      console.error("Помилка виходу:", error)
      toast({ variant: "destructive", title: "Помилка виходу", description: "Сталася неочікувана помилка." })
    }
  }, [router, toast])

  const renderUserControls = React.useCallback(() => {
    if (isLoading) {
      return <Skeleton className="h-9 w-9 rounded-full" />;
    }

    if (currentUser?.isLoggedIn) {
      if (currentUser.role === 'admin') {
        return (
          <div className="flex items-center space-x-2">
            <Button asChild variant="secondary" size="sm">
                <Link href="/admin">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Адмін Панель
                </Link>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Вийти
            </Button>
          </div>
        );
      }
      if (currentUser.role === 'user') {
        return (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                    <AvatarFallback>{currentUser.username?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.department}</p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Профіль</span>
                    </Link>
                </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Вийти</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        );
      }
    }

    return (
        <Link href="/login" className={buttonVariants({ variant: "default", size: "sm" })}>
            <LogIn className="mr-2 h-4 w-4" />
            Увійти
        </Link>
    );
  }, [isLoading, currentUser, handleLogout, router])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.Logo className="h-7 w-7 text-primary" />
            <span className="inline-block font-headline text-xl font-bold text-primary">
              {siteConfig.name}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link href="/history" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <History className="mr-2 h-4 w-4" />
                Історія
            </Link>
            {renderUserControls()}
          </nav>
        </div>
      </div>
    </header>
  )
}
