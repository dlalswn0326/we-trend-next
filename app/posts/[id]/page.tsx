import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/feed/PostCard"
import { notFound } from "next/navigation"

export default async function PostDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: postData } = await supabase
        .from("posts")
        .select(`
      *,
      author:profiles(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
        .eq("id", id)
        .single()

    if (!postData) {
        notFound()
    }

    let userHasLiked = false
    let userHasBookmarked = false

    if (user) {
        const { data: like } = await supabase
            .from("likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", id)
            .single()
        userHasLiked = !!like

        const { data: bookmark } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", id)
            .single()
        userHasBookmarked = !!bookmark
    }

    const post = {
        ...postData,
        likes_count: postData.likes_count?.[0]?.count || 0,
        comments_count: postData.comments_count?.[0]?.count || 0,
        user_has_liked: userHasLiked,
        user_has_bookmarked: userHasBookmarked
    }

    return (
        <div className="max-w-2xl mx-auto">
            <PostCard post={post} />
        </div>
    )
}
