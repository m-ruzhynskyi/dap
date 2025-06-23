
"use client"

import * as React from "react"
import type { HistoryEntry } from "@/types"
import { columns } from "./columns"
import { DataTable } from "@/components/data-table/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

async function fetchHistory(): Promise<HistoryEntry[]> {
    const res = await fetch("/api/history")
    if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Не вдалося завантажити історію")
    }
    return res.json()
}

export default function HistoryPage() {
    const [history, setHistory] = React.useState<HistoryEntry[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const { toast } = useToast()

    const loadHistory = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const fetchedHistory = await fetchHistory()
            setHistory(fetchedHistory)
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
        loadHistory()
    }, [loadHistory])

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <Skeleton className="h-10 w-48 mb-4" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">Історія змін</h1>
            <DataTable
                columns={columns}
                data={history}
                isUserLoggedIn={false} 
            />
        </div>
    )
}
