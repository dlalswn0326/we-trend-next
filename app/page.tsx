
import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/feed/PostCard"
import { WriteBox } from "@/components/feed/WriteBox"
import type { Post } from "@/types"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile for updated avatar
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    userProfile = profile
  }

  let posts: Post[] = []

  const { data } = await supabase
    .from("posts")
    .select(`
        *,
        author:profiles(*),
        likes_count:likes(count),
        comments_count:comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  if (data) {
    // Basic liked/bookmarked check
    let userLikes: string[] = []
    let userBookmarks: string[] = []

    if (user) {
      const { data: lu } = await supabase.from('likes').select('post_id').eq('user_id', user.id)
      if (lu) userLikes = lu.map(l => l.post_id)

      const { data: bu } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id)
      if (bu) userBookmarks = bu.map(b => b.post_id)
    }

    posts = data.map((post: any) => ({
      ...post,
      likes_count: post.likes_count?.[0]?.count || 0,
      comments_count: post.comments_count?.[0]?.count || 0,
      user_has_liked: userLikes.includes(post.id),
      user_has_bookmarked: userBookmarks.includes(post.id)
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-14 md:top-0 bg-background/80 backdrop-blur z-30 border-b md:hidden">
      </div>

      <WriteBox user={user} profile={userProfile} />

      <div className="flex-1 py-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
