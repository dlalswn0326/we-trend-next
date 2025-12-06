"use client"

import { useEffect, useState } from "react"
import { PostCard } from "@/components/feed/PostCard"
import { CommentCard } from "@/components/feed/CommentCard"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { Post } from "@/types"

export default function ActivityPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("my-posts")
    const supabase = createClient()

    useEffect(() => {
        fetchActivity(activeTab)
    }, [activeTab])

    const fetchActivity = async (tab: string) => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        if (tab === "my-posts") {
            // Fetch user's own posts
            const { data: postsData } = await supabase
                .from("posts")
                .select(`*, author:profiles(*), likes_count:likes(count), comments_count:comments(count)`)
                .eq("author_id", user.id)
                .order("created_at", { ascending: false })

            if (postsData) {
                const { data: lu } = await supabase.from('likes').select('post_id').eq('user_id', user.id)
                const userLikes = lu ? lu.map(l => l.post_id) : []

                const { data: bu } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id)
                const userBookmarks = bu ? bu.map(b => b.post_id) : []

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
        } else if (tab === "comments") {
            // Fetch user's comments with post info
            const { data: commentsData } = await supabase
                .from("comments")
                .select(`
                    *,
                    post:posts(
                        id,
                        content,
                        author:profiles(display_name, avatar_url)
                    )
                `)
                .eq("author_id", user.id)
                .order("created_at", { ascending: false })

            setComments(commentsData || [])
        } else {
            // Existing tabs: likes, bookmarks
            let postIds: string[] = []

            if (tab === "likes") {
                const { data: likes } = await supabase.from("likes").select("post_id").eq("user_id", user.id)
                if (likes) postIds = likes.map(l => l.post_id)
            } else if (tab === "bookmarks") {
                const { data: bookmarks } = await supabase.from("bookmarks").select("post_id").eq("user_id", user.id)
                if (bookmarks) postIds = bookmarks.map(b => b.post_id)
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
        }
        setLoading(false)
    }

    const tabs = [
        { id: "my-posts", label: "내 게시글" },
        { id: "likes", label: "좋아요" },
        { id: "bookmarks", label: "북마크" },
        { id: "comments", label: "댓글" }
    ]

    return (
        <div className="flex flex-col min-h-screen p-4">
            <h1 className="text-xl font-bold mb-4">활동</h1>

            <div className="flex border-b mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    {activeTab === "comments" ? (
                        comments.length > 0 ? (
                            comments.map(comment => <CommentCard key={comment.id} comment={comment} />)
                        ) : (
                            <div className="text-center text-muted-foreground py-10">댓글 내역이 없습니다.</div>
                        )
                    ) : (
                        posts.length > 0 ? (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        ) : (
                            <div className="text-center text-muted-foreground py-10">활동 내역이 없습니다.</div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
