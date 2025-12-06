
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/sign-in")
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    return (
        <div className="p-4">
            <div className="flex flex-col items-center py-10">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10">
                    <AvatarImage src={profile?.avatar_url || user.user_metadata.avatar_url} />
                    <AvatarFallback>{profile?.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{profile?.display_name || user.email}</h2>
                <p className="text-muted-foreground mb-6">@{user.email?.split("@")[0]}</p>

                <div className="flex gap-3">
                    <a
                        href="/profile/edit"
                        className="inline-flex items-center justify-center rounded-full border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        프로필 수정
                    </a>
                    <Button variant="ghost" className="rounded-full px-8 text-muted-foreground">설정</Button>
                </div>
            </div>
        </div>
    )
}
