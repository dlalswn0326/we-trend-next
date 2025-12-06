
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "홈", href: "/", icon: Icons.home },
    { name: "검색", href: "/search", icon: Icons.search },
    { name: "글쓰기", href: "/write", icon: Icons.write },
    { name: "활동", href: "/activity", icon: Icons.activity },
    { name: "프로필", href: "/profile", icon: Icons.profile },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-background flex items-center justify-around z-40 px-2 pb-safe">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-colors",
                            isActive && "text-foreground"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isActive && "stroke-[3px]")} />
                        <span className="sr-only">{item.name}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
