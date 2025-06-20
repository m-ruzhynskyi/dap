
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation" 
import { siteConfig } from "@/config/site"
import { Icons } from "@/components/icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { User, Settings, LogOut, LogIn } from "lucide-react" 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import type { UserSession } from "@/lib/auth" 
import { useToast } from "@/hooks/use-toast"

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
      console.error("Failed to fetch user session:", error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }, []);

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
          <nav className="flex items-center space-x-1">
            {isLoading ? (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full animate-pulse bg-muted"></Button>
            ) : currentUser?.isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="Аватар користувача" data-ai-hint="user avatar" />
                      <AvatarFallback>{currentUser.username?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.username}</p>
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
            ) : (
              <Link href="/login" className={buttonVariants({ variant: "default", size: "sm" })}>
                <LogIn className="mr-2 h-4 w-4" />
                Увійти
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
