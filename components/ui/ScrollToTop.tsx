"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener("scroll", toggleVisibility)

        return () => window.removeEventListener("scroll", toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <Button
            size="icon"
            className={cn(
                "fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 rounded-full shadow-lg transition-all duration-300 hover:scale-110 opacity-0 invisible",
                isVisible && "opacity-100 visible"
            )}
            onClick={scrollToTop}
        >
            <Icons.arrowUp className="h-5 w-5" />
            <span className="sr-only">Scroll to top</span>
        </Button>
    )
}
