
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"

export default function LoginPage() {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        toast({
          title: "Вхід успішний",
          description: `Вітаємо, ${data.username}!`,
        })
        if (data.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        router.refresh() 
      } else {
        setError(data.error || "Помилка входу. Будь ласка, спробуйте ще раз.")
        toast({
          variant: "destructive",
          title: "Помилка входу",
          description: data.error || "Невірні облікові дані або помилка сервера.",
        })
      }
    } catch (err) {
      console.error("Login fetch error:", err)
      setError("Сталася неочікувана помилка. Будь ласка, спробуйте ще раз.")
      toast({
        variant: "destructive",
        title: "Помилка входу",
        description: "Не вдалося підключитися до сервера. Будь ласка, перевірте мережу.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Вхід до TechTracker</CardTitle>
          <CardDescription>Введіть ваш логін та пароль.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Ім'я користувача</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="І`мя користувача ..."
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вхід..." : "Увійти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
