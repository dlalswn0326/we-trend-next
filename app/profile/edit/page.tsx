"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/icons"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileEditPage() {
    const [user, setUser] = useState<any>(null)
    const [name, setName] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/auth/sign-in")
                return
            }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (profile) {
                setName(profile.display_name || "")
                setAvatarUrl(profile.avatar_url)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [router, supabase])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`

        // Optimistic update
        const previewUrl = URL.createObjectURL(file)
        setAvatarUrl(previewUrl)

        const { error } = await supabase.storage
            .from("avatars")
            .upload(fileName, file, { upsert: true })

        if (error) {
            alert("이미지 업로드 실패")
            console.error(error)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName)

        setAvatarUrl(publicUrl)
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)

        const updates = {
            id: user.id,
            display_name: name,
            avatar_url: avatarUrl,
        }

        const { data, error } = await supabase
            .from("profiles")
            .upsert(updates)
            .select()

        console.log("Upsert result:", { data, error })

        if (error) {
            alert(`프로필 저장 실패: ${error.message || JSON.stringify(error)}`)
            console.error("Full error:", error)
        } else {
            router.push("/profile")
            router.refresh()
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="p-4 max-w-md mx-auto space-y-8">
                <div className="flex flex-col items-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-8 w-32" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-8 text-center">프로필 수정</h1>

            <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="h-24 w-24 ring-4 ring-secondary transition-all group-hover:ring-primary/20">
                        <AvatarImage src={avatarUrl || user?.user_metadata.avatar_url || undefined} />
                        <AvatarFallback>{name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.image className="h-6 w-6 text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <p className="text-xs text-muted-foreground mt-2">이미지를 클릭하여 변경</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">이름</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        취소
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                    >
                        {saving ? <Icons.spinner className="animate-spin mr-2" /> : null}
                        저장하기
                    </Button>
                </div>
            </div>
        </div>
    )
}
