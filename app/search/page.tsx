
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { PostCard } from "@/components/feed/PostCard"
import { createClient } from "@/lib/supabase/client"
import type { Post } from "@/types"

export default function SearchPage() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Post[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        // Using Supabase textSearch if full text search is enabled, or ilike for simple match
        // Spec said "Supabase full-text search available". I'll assume simple text search on content.
        const { data } = await supabase
            .from("posts")
            .select(`
            *,
            author:profiles(*),
            likes_count:likes(count),
            comments_count:comments(count)
        `)
            .ilike("content", `%${query}%`)
            .order("created_at", { ascending: false })
            .limit(20)

        if (data) {
            // Warning: user_has_liked is missing here (client side fetch usually needs session check logic repeatedly)
            // For search results, we'll optimistically default false or ideally fetch user interactions too.
            // For simplicity:
            const { data: { user } } = await supabase.auth.getUser()

            let userLikes: string[] = []
            let userBookmarks: string[] = []

            if (user) {
                const resultIds = data.map((p: any) => p.id)
                if (resultIds.length > 0) {
                    const { data: lu } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', resultIds)
                    if (lu) userLikes = lu.map(l => l.post_id)

                    const { data: bu } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id).in('post_id', resultIds)
                    if (bu) userBookmarks = bu.map(b => b.post_id)
                }
            }

            const mappedPosts = data.map((post: any) => ({
                ...post,
                likes_count: post.likes_count?.[0]?.count || 0,
                comments_count: post.comments_count?.[0]?.count || 0,
                user_has_liked: userLikes.includes(post.id),
                user_has_bookmarked: userBookmarks.includes(post.id)
            }))
            setResults(mappedPosts)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col min-h-screen p-4">
            <h1 className="text-xl font-bold mb-4">검색</h1>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <Icons.search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="검색어 입력..."
                        className="pl-9 rounded-full bg-secondary border-none h-10"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </form>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Icons.spinner className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map(post => <PostCard key={post.id} post={post} />)
                    ) : query && !loading ? (
                        <div className="text-center text-muted-foreground py-10">검색 결과가 없습니다.</div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
