'use client'
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
type Props = {
    children: React.ReactNode
}

const TanstackQuery = ({ children }: Props) => {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 3,
                gcTime: 1000 * 60 * 10,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: 1,
            },
            mutations: {
                retry: 1,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

export default TanstackQuery
