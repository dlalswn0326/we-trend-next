
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Icons } from "@/components/icons"

export default function SignUpPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`
                }
            }
        })

        if (error) {
            alert("회원가입 실패: " + error.message)
        } else {
            alert("회원가입 성공! 이메일을 확인하거나 로그인을 시도해주세요.")
            router.push("/auth/sign-in")
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">회원가입</h1>
                    <p className="text-muted-foreground">계정을 생성하고 We-Trend를 시작하세요</p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            placeholder="이름 (닉네임)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                        회원가입
                    </Button>
                </form>
                <div className="text-center text-sm">
                    이미 계정이 있으신가요? <Link href="/auth/sign-in" className="underline">로그인</Link>
                </div>
            </div>
        </div>
    )
}
