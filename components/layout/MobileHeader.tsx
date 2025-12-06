
"use client"

import Link from "next/link"
import { Icons } from "@/components/icons"

export function MobileHeader() {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-40">
            <Link href="/" className="font-bold text-lg">
                We-Trend
            </Link>
            <Link href="/search">
                <Icons.search className="h-6 w-6 text-muted-foreground" />
            </Link>
        </header>
    )
}
