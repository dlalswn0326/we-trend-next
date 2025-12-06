
"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Post } from "@/types"

interface PostCardProps {
    post: Post
}

export function PostCard({ post: initialPost }: PostCardProps) {
    const [post, setPost] = useState(initialPost)
    const [isLikeLoading, setIsLikeLoading] = useState(false)
    const supabase = createClient()

    const handleLike = async () => {
        if (isLikeLoading) return
        setIsLikeLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert("로그인이 필요합니다.")
            setIsLikeLoading(false)
            return
        }

        if (post.user_has_liked) {
            // Unlike
            const { error } = await supabase
                .from("likes")
                .delete()
                .match({ post_id: post.id, user_id: user.id })

            if (!error) {
                setPost(prev => ({
                    ...prev,
                    likes_count: Math.max(0, prev.likes_count - 1),
                    user_has_liked: false
                }))
            }
        } else {
            // Like
            const { error } = await supabase
                .from("likes")
                .insert({ post_id: post.id, user_id: user.id })

            if (!error) {
                setPost(prev => ({
                    ...prev,
                    likes_count: prev.likes_count + 1,
                    user_has_liked: true
                }))
            }
        }
        setIsLikeLoading(false)
    }

    const handleBookmark = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert("로그인이 필요합니다.")

        if (post.user_has_bookmarked) {
            const { error } = await supabase.from("bookmarks").delete().match({ post_id: post.id, user_id: user.id })
            if (!error) setPost(p => ({ ...p, user_has_bookmarked: false }))
        } else {
            const { error } = await supabase.from("bookmarks").insert({ post_id: post.id, user_id: user.id })
            if (!error) setPost(p => ({ ...p, user_has_bookmarked: true }))
        }
    }

    const [showComments, setShowComments] = useState(false)
    const [comments, setComments] = useState<any[]>([])
    const [commentContent, setCommentContent] = useState("")
    const [isCommentLoading, setIsCommentLoading] = useState(false)

    const toggleComments = async () => {
        if (!showComments) {
            // Load comments
            const { data } = await supabase
                .from("comments")
                .select("*, author:profiles(*)")
                .eq("post_id", post.id)
                .order("created_at", { ascending: true })
            if (data) setComments(data)
        }
        setShowComments(!showComments)
    }

    const handleSubmitComment = async () => {
        if (!commentContent.trim()) return
        setIsCommentLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert("로그인이 필요합니다.")
            setIsCommentLoading(false)
            return
        }

        const { data, error } = await supabase
            .from("comments")
            .insert({
                post_id: post.id,
                author_id: user.id,
                content: commentContent
            })
            .select("*, author:profiles(*)")
            .single()

        if (!error && data) {
            setComments([...comments, data])
            setCommentContent("")
            setPost(prev => ({
                ...prev,
                comments_count: prev.comments_count + 1
            }))
        } else {
            alert("댓글 작성 실패")
        }
        setIsCommentLoading(false)
    }

    return (
        <Card className="border-0 shadow-none border-b rounded-none px-0 pb-4 mb-4">
            <CardHeader className="flex flex-row items-start gap-4 p-0 pb-3 space-y-0">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={post.author?.avatar_url || ""} />
                    <AvatarFallback>{post.author?.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold mr-2">{post.author?.display_name || "알 수 없음"}</span>
                            <span className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}
                            </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Icons.more className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 pl-14 pb-3">
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed mb-2">
                    {post.content}
                </div>

                {post.source_url && (
                    post.source === "MANUAL" ? (
                        <div className="mb-3 rounded-lg overflow-hidden border">
                            <img
                                src={post.source_url}
                                alt="Post content"
                                className="w-full h-auto object-cover max-h-[500px]"
                            />
                        </div>
                    ) : (
                        <a
                            href={post.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg hover:bg-secondary transition-colors mb-3 truncate"
                        >
                            🔗 원본 기사 보기: {new URL(post.source_url).hostname}
                        </a>
                    )
                )}

                <div className="flex items-center gap-4 mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("px-2 h-8 text-muted-foreground hover:text-red-500", post.user_has_liked && "text-red-500")}
                        onClick={handleLike}
                        disabled={isLikeLoading}
                    >
                        <Icons.activity className={cn("mr-1.5 h-4 w-4", post.user_has_liked && "fill-current")} />
                        {post.likes_count > 0 && post.likes_count}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 h-8 text-muted-foreground"
                        onClick={toggleComments}
                    >
                        <Icons.comment className="mr-1.5 h-4 w-4" />
                        {post.comments_count > 0 && post.comments_count}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("px-2 h-8 text-muted-foreground ml-auto", post.user_has_bookmarked && "text-foreground")}
                        onClick={handleBookmark}
                    >
                        <Icons.bookmark className={cn("h-4 w-4", post.user_has_bookmarked && "fill-current")} />
                    </Button>

                    <Button variant="ghost" size="sm" className="px-2 h-8 text-muted-foreground">
                        <Icons.send className="h-4 w-4" />
                    </Button>
                </div>

                {/* Comment Section */}
                {showComments && (
                    <div className="pt-3 border-t mt-2">
                        <div className="space-y-4 mb-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.author?.avatar_url} />
                                        <AvatarFallback>{comment.author?.display_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{comment.author?.display_name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                            </span>
                                        </div>
                                        <p className="text-foreground">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder="댓글 달기..."
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                            />
                            <Button
                                size="sm"
                                disabled={!commentContent.trim() || isCommentLoading}
                                onClick={handleSubmitComment}
                                className="rounded-full"
                            >
                                게시
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
