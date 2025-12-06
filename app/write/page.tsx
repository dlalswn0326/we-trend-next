
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Icons } from "@/components/icons"

export default function WritePage() {
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async () => {
        if (!content.trim()) return
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert("로그인이 필요합니다.")
            router.push("/auth/sign-in")
            return
        }

        const { error } = await supabase.from("posts").insert({
            author_id: user.id,
            content: content,
            source: "MANUAL",
            is_ai_generated: false
        })

        if (error) {
            alert("게시글 작성에 실패했습니다.")
        } else {
            router.push("/")
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">새로운 게시글</h1>
            </div>

            <Textarea
                placeholder="무슨 생각을 하고 계신가요?"
                className="min-h-[200px] text-lg border-none shadow-none resize-none p-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
            />

            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={loading || !content.trim()} className="rounded-full px-8">
                    {loading ? <Icons.spinner className="animate-spin" /> : "게시하기"}
                </Button>
            </div>
        </div>
    )
}
