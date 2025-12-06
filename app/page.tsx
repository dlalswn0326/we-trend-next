"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "@/components/feed/PostCard"
import { WriteBox } from "@/components/feed/WriteBox"
import { Icons } from "@/components/icons"
import type { Post } from "@/types"

const POSTS_PER_PAGE = 20

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setUserProfile(profile)
      }

      await loadPosts(0)
      setLoading(false)
    }
    fetchInitialData()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(offset)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, offset])

  const loadPosts = async (currentOffset: number) => {
    setLoadingMore(true)

    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        author:profiles(*),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1)

    if (data) {
      let userLikes: string[] = []
      let userBookmarks: string[] = []

      if (user) {
        const { data: lu } = await supabase.from('likes').select('post_id').eq('user_id', user.id)
        if (lu) userLikes = lu.map(l => l.post_id)

        const { data: bu } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id)
        if (bu) userBookmarks = bu.map(b => b.post_id)
      }

      const mappedPosts = data.map((post: any) => ({
        ...post,
        likes_count: post.likes_count?.[0]?.count || 0,
        comments_count: post.comments_count?.[0]?.count || 0,
        user_has_liked: userLikes.includes(post.id),
        user_has_bookmarked: userBookmarks.includes(post.id)
      }))

      setPosts(prev => [...prev, ...mappedPosts])
      setOffset(currentOffset + POSTS_PER_PAGE)
      setHasMore(data.length === POSTS_PER_PAGE)
    } else {
      setHasMore(false)
    }

    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Icons.spinner className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
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
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-8">
              {loadingMore && (
                <div className="flex justify-center">
                  <Icons.spinner className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="text-center text-muted-foreground text-sm">
                  모든 게시글을 확인했습니다
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
