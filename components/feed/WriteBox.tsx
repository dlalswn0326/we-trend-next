"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Icons } from "@/components/icons"
import type { User } from "@supabase/supabase-js"

interface WriteBoxProps {
    user: User | null
    profile?: any
}

export function WriteBox({ user, profile }: WriteBoxProps) {

    const [content, setContent] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [guestAvatar, setGuestAvatar] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (!user) {
            const seed = Math.random().toString(36).substring(7)
            setGuestAvatar(`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`)
        }
    }, [user])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            if (confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?")) {
                router.push("/auth/sign-in")
            }
            return
        }
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const url = URL.createObjectURL(selectedFile)
            setPreviewUrl(url)
        }
    }

    const handleSubmit = async () => {
        if (!user) {
            if (confirm("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?")) {
                router.push("/auth/sign-in")
            }
            return
        }

        if (!content.trim() && !file) return
        setLoading(true)

        let imageUrl = null

        if (file) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const bucketName = "images" // User must create this bucket

            const { data, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file)

            if (uploadError) {
                console.error("Upload error:", uploadError)
                alert("이미지 업로드에 실패했습니다. (버킷이 생성되었는지 확인해주세요)")
                setLoading(false)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            imageUrl = publicUrl
        }

        const { error } = await supabase.from("posts").insert({
            author_id: user.id,
            content: content,
            source: "MANUAL",
            source_url: imageUrl, // Use source_url for image link
            is_ai_generated: false
        })

        if (error) {
            alert("게시글 작성에 실패했습니다.")
        } else {
            setContent("")
            setFile(null)
            setPreviewUrl(null)
            router.refresh()
        }
        setLoading(false)
    }

    // Prioritize profile avatar, then OAuth avatar, then guest avatar
    const avatarUrl = profile?.avatar_url || user?.user_metadata.avatar_url || guestAvatar || undefined
    const displayName = profile?.display_name || user?.user_metadata.full_name

    return (
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
            <div className="flex gap-4">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{displayName?.[0] || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                    {!content && !file && (
                        <div className="flex justify-between items-center text-muted-foreground mb-1 ml-1 animate-in fade-in duration-300">
                            <span className="font-medium text-sm text-primary/80">여러분의 AI/IT 트렌드를 공유해 주세요 ✨</span>
                        </div>
                    )}

                    <div className="relative">
                        <Textarea
                            placeholder="새로운 소식이 있나요?"
                            className="min-h-[80px] w-full resize-none border-none bg-transparent p-1 text-base placeholder:text-muted-foreground/50 focus-visible:ring-0"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {previewUrl && (
                        <div className="relative mb-4 group">
                            <div className="overflow-hidden rounded-xl border border-border/50 bg-secondary/20">
                                <img src={previewUrl} alt="Preview" className="max-h-80 w-full object-contain" />
                            </div>
                            <button
                                onClick={() => {
                                    setFile(null)
                                    setPreviewUrl(null)
                                }}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                            >
                                <Icons.close className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Icons.image className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || (!content.trim() && !file && !user)}
                            className="rounded-full px-6 font-semibold shadow-sm transition-all hover:shadow-md"
                        >
                            {loading ? <Icons.spinner className="animate-spin" /> : "게시하기"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
