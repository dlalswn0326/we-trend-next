
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

const sidebarItems = [
    { name: "홈", href: "/", icon: Icons.home },
    { name: "검색", href: "/search", icon: Icons.search },
    { name: "글쓰기", href: "/write", icon: Icons.write },
    { name: "활동", href: "/activity", icon: Icons.activity },
    { name: "프로필", href: "/profile", icon: Icons.profile },
]

export function Sidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.reload()
    }

    return (
        <aside className="hidden md:flex h-screen w-[240px] flex-col fixed left-0 top-0 border-r bg-background p-4 z-40">
            <div className="mb-8 pl-2">
                <Link href="/" className="text-xl font-bold tracking-tight">
                    We-Trend
                </Link>
            </div>

            <nav className="flex-1 space-y-2">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary",
                                isActive ? "text-foreground font-bold" : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "stroke-[3px]")} />
                            <span className="text-lg">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto">
                {user ? (
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary text-muted-foreground"
                    >
                        <Icons.logout className="h-6 w-6" />
                        <span className="text-lg">로그아웃</span>
                    </button>
                ) : (
                    <Link
                        href="/auth/sign-in"
                        className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary text-muted-foreground"
                    >
                        <Icons.login className="h-6 w-6" />
                        <div className="flex flex-col items-start ml-1">
                            <span className="text-lg leading-none">로그인</span>
                            <span className="text-xs text-muted-foreground mt-1">더 많은 기능 사용</span>
                        </div>
                    </Link>
                )}
            </div>
        </aside>
    )
}
