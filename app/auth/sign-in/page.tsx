
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Icons } from "@/components/icons"

export default function SignInPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert("로그인 실패: " + error.message)
        } else {
            router.push("/")
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">로그인</h1>
                    <p className="text-muted-foreground">이메일과 비밀번호로 로그인하세요</p>
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Icons.spinner className="animate-spin mr-2" />}
                        로그인
                    </Button>
                </form>
                <div className="text-center text-sm">
                    계정이 없으신가요? <Link href="/auth/sign-up" className="underline">회원가입</Link>
                </div>
            </div>
        </div>
    )
}
