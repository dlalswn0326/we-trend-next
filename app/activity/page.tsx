
"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/PostCard"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { Post } from "@/types"

export default function ActivityPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Initial fetch for default tab 'likes' - this is handled by Tabs onValueChange? 
    // No, onValueChange triggers when user clicks. Initial load needs explicit call or default.
    // Actually, Radix Tabs (which shadcn mimics) mounts content...
    // But my simple Tabs implementation in components/ui/tabs.tsx is just divs and buttons styling, it doesn't handle state unless I used the Radix one or built it.
    // Wait, I implemented a DUMB Tabs component in `components/ui/tabs.tsx` which just exports styled divs. It has NO Logic.
    // So I need state management in `ActivityPage`.
    // My previous "Tabs" implementation was just `export { Tabs, ... }` with `cn`. It does NOT have `value`, `onValueChange` logic.
    // So `Tabs` component I wrote acts as a container. `TabsTrigger` is a button.
    // I must implement the state manually or use `Tabs` from `radix-ui` (which I didn't install).
    // I will implement the state manually in the Page, and just use the Tabs components for styling if possible, or just standard buttons.
    // I will go back to the manual implementation I had, but cleaner.
    // Or I can make `Tabs` controlled? 
    // Pass `value` and `onValueChange` to `Tabs`? No my component doesn't accept them.
    // I will ignore `Tabs` component for logic and just use it for styling, or better, just use the `div` structure I had but with correct imports.
    // Actually, I'll stick to the "Simple" approach I had originally but fix the lint error (Tabs imported but unused).
    // So I'll remove the Tabs import and use the manual buttons.

    const [activeTab, setActiveTab] = useState("likes")

    useEffect(() => {
        fetchActivity(activeTab)
    }, [activeTab]) // Fetch when tab changes

    const fetchActivity = async (tab: string) => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        let postIds: string[] = []

        if (tab === "likes") {
            const { data: likes } = await supabase.from("likes").select("post_id").eq("user_id", user.id)
            if (likes) postIds = likes.map(l => l.post_id)
        } else if (tab === "bookmarks") {
            const { data: bookmarks } = await supabase.from("bookmarks").select("post_id").eq("user_id", user.id)
            if (bookmarks) postIds = bookmarks.map(b => b.post_id)
        } else if (tab === "comments") {
            const { data: comments } = await supabase.from("comments").select("post_id").eq("author_id", user.id)
            if (comments) postIds = Array.from(new Set(comments.map(c => c.post_id)))
        }

        if (postIds.length > 0) {
            const { data: postsData } = await supabase
                .from("posts")
                .select(`*, author:profiles(*), likes_count:likes(count), comments_count:comments(count)`)
                .in("id", postIds)
                .order("created_at", { ascending: false })

            if (postsData && postsData.length > 0) {
                let userLikes: string[] = []
                let userBookmarks: string[] = []

                if (tab === "likes") userLikes = postIds
                else {
                    const { data: lu } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
                    if (lu) userLikes = lu.map(l => l.post_id)
                }

                if (tab === "bookmarks") userBookmarks = postIds
                else {
                    const { data: bu } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id).in('post_id', postIds)
                    if (bu) userBookmarks = bu.map(b => b.post_id)
                }

                const mapped = postsData.map((post: any) => ({
                    ...post,
                    likes_count: post.likes_count?.[0]?.count || 0,
                    comments_count: post.comments_count?.[0]?.count || 0,
                    user_has_liked: userLikes.includes(post.id),
                    user_has_bookmarked: userBookmarks.includes(post.id)
                }))
                setPosts(mapped)
            } else {
                setPosts([])
            }
        } else {
            setPosts([])
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col min-h-screen p-4">
            <h1 className="text-xl font-bold mb-4">활동</h1>

            <div className="flex border-b mb-4">
                <button
                    onClick={() => setActiveTab("likes")}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === "likes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                >
                    좋아요
                </button>
                <button
                    onClick={() => setActiveTab("bookmarks")}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === "bookmarks" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                >
                    북마크
                </button>
                <button
                    onClick={() => setActiveTab("comments")}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === "comments" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                >
                    댓글
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.length > 0 ? (
                        posts.map(post => <PostCard key={post.id} post={post} />)
                    ) : (
                        <div className="text-center text-muted-foreground py-10">활동 내역이 없습니다.</div>
                    )}
                </div>
            )}
        </div>
    )
}
